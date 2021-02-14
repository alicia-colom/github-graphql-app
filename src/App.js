import React, { Component } from 'react';
import axios from 'axios';

// Services: Inicializar Axios para después usarlo en las consultas a las API
const axiosGitHubGraphQL = axios.create({
	baseURL: 'https://api.github.com/graphql',
	headers: {
		Authorization: 'bearer d91c031e61ef56398a404ba7b8287ba25a2746f2',
	},
});

// ***** Queries *****
const GET_ORGANIZATION = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
    }
  }
`;

const GET_REPOSITORY_OF_ORGANIZATION = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
      repository(name: "the-road-to-learn-react") {
        name
        url
      }
    }
  }
`;

const getIssuesOfRepositoryQuery = (primerparam, segundoparam) => `
  {
    organization(login: "${primerparam}") {
      name
      url
      repository(name: "${segundoparam}") {
        name
        url
        issues(last: 5) {
          edges {
            node {
              id
              title
              url
            }
          }
        }
      }
    }
  }
`;

const GET_ISSUES_OF_REPOSITORY = `
  query ($organization: String!, $repository: String!, $cursor: String) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        id
        name
        url
        stargazers {
          totalCount
        }
        viewerHasStarred
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

const ADD_STAR = `
  mutation ($repositoryId: ID!) {
    addStar(input:{starrableId:$repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;
// ***** END de queries *****

// ***** Trozos de funciones específicas *****
const getIssuesOfRepository = (path, cursor) => {
	const [organization, repository] = path.split('/');

	return axiosGitHubGraphQL.post('', {
		query: GET_ISSUES_OF_REPOSITORY,
		variables: { organization, repository, cursor },
	});
};

const addStarToRepository = (repositoryId) => {
	return axiosGitHubGraphQL.post('', {
		query: ADD_STAR,
		variables: { repositoryId },
	});
};

const resolveIssuesQuery = (queryResult, cursor) => (state) => {
	const { data, errors } = queryResult.data;

	// En la primera llamada no hay Cursor
	if (!cursor) {
		return {
			organization: data.organization,
			errors,
		};
	}
	// Estructura válida para hacer cargas tipo Scroll infinito:
	// es decir, añade a los resultados que ya tenemos almacenados en el state
	// los nuevos datos, y eso será lo que se pinte en el navegador.
	const { edges: oldIssues } = state.organization.repository.issues;
	const { edges: newIssues } = data.organization.repository.issues;
	const updatedIssues = [...oldIssues, ...newIssues];

	return {
		organization: {
			...data.organization,
			repository: {
				...data.organization.repository,
				issues: {
					...data.organization.repository.issues,
					edges: updatedIssues,
				},
			},
		},
		errors,
	};
};

const resolveAddStarMutation = (mutationResult) => (state) => {
	const { viewerHasStarred } = mutationResult.data.data.addStar.starrable;
	const { totalCount } = state.organization.repository.stargazers;

	return {
		...state,
		organization: {
			...state.organization,
			repository: {
				...state.organization.repository,
				viewerHasStarred,
			},
		},
	};
};
// ***** END of Trozos de funciones específicas *****

// ***** COMPONENTE APP *****
class App extends Component {
	state = {
		path: 'the-road-to-learn-react/the-road-to-learn-react',
		organization: null,
		errors: null,
	};

	componentDidMount() {
		this.onFetchFromGitHub(this.state.path);
	}

	onChange = (event) => {
		this.setState({ path: event.target.value });
	};

	onSubmit = (event) => {
		this.onFetchFromGitHub(this.state.path);
		event.preventDefault();
	};

	// Fetchs
	onFetchFromGitHub = (path, cursor) => {
		getIssuesOfRepository(path, cursor).then((queryResult) =>
			this.setState(resolveIssuesQuery(queryResult, cursor))
		);
	};

	onFetchMoreIssues = () => {
		const { endCursor } = this.state.organization.repository.issues.pageInfo;
		this.onFetchFromGitHub(this.state.path, endCursor);
	};

	onStarRepository = (repositoryId, viewerHasStarred) => {
		addStarToRepository(repositoryId).then((mutationResult) =>
			this.setState(resolveAddStarMutation(mutationResult))
		);
	};

	render() {
		const { path, organization, errors } = this.state;

		return (
			<div>
				<h1>GitHub's GraphQL API</h1>
        <h2>React app with GraphQL GitHub Client</h2>
				<form onSubmit={this.onSubmit}>
					<label htmlFor="url">Show open issues for https://github.com/</label>
					<input
						id="url"
						type="text"
						value={path}
						onChange={this.onChange}
						style={{ width: '300px' }}
					/>
					<button type="submit">Search</button>
				</form>
				<hr />
				{organization ? (
					<Organization
						organization={organization}
						errors={errors}
						onFetchMoreIssues={this.onFetchMoreIssues}
						onStarRepository={this.onStarRepository}
					/>
				) : (
					<p>No information yet...</p>
				)}
			</div>
		);
	}
}
// ***** END of Componente App *****

// ***** COMPONENTE ORGANIZATION *****
const Organization = ({
	organization,
	errors,
	onFetchMoreIssues,
	onStarRepository,
}) => {
	if (errors) {
		return (
			<p>
				<strong>Something went wrong:</strong>
				{errors.map((error) => error.message).join(', and also ')}
			</p>
		);
	}

	return (
		<div>
			<p>
				<strong>You have search the Organization: </strong>
				<a href={organization.url}>{organization.name}</a>
			</p>

			<Repository
				repository={organization.repository}
				onFetchMoreIssues={onFetchMoreIssues}
				onStarRepository={onStarRepository}
			/>
		</div>
	);
};
// ***** END of Componente Organization *****

// ***** COMPONENTE REPOSITORY *****
const Repository = ({ repository, onFetchMoreIssues, onStarRepository }) => (
	<div>
		<p>
			<strong>... and also its Repository: </strong>
			<a href={repository.url}>{repository.name}</a>
		</p>
		<button
			type="button"
			onClick={() =>
				onStarRepository(repository.id, repository.viewerHasStarred)
			}
		>
			This repository has <strong>{repository.stargazers.totalCount} stars</strong> - Do you want
			to
			<strong>{repository.viewerHasStarred ? ' unstar it' : ' star it'}</strong> ?
		</button>
		<p>
			<strong>... which has the next Issues:</strong>
		</p>
		<ul>
			{repository.issues.edges.map((issue) => (
				<li key={issue.node.id}>
					<a href={issue.node.url}>{issue.node.title}</a>

					<ul>
						{issue.node.reactions.edges.map((reaction) => (
							<li key={reaction.node.id}>{reaction.node.content}</li>
						))}
					</ul>
				</li>
			))}
		</ul>

		<hr />

		{repository.issues.pageInfo.hasNextPage && (
			<button onClick={onFetchMoreIssues}>Load more issues</button>
		)}
	</div>
);
// ***** END of Componente Repository *****

export default App;
