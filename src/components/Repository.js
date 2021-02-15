import React from 'react';

// { repository, onFetchMoreIssues, onStarRepository }

const Repository = (props) => (
	<div>
		<p>
			<strong>... and also its Repository: </strong>
			<a href={props.repository.url}>{props.repository.name}</a>
		</p>
		<button
			type="button"
			onClick={() =>
				props.onStarRepository(
					props.repository.id,
					props.repository.viewerHasStarred
				)
			}
		>
			This repository has{' '}
			<strong>{props.repository.stargazers.totalCount} stars</strong> - Do you
			want to
			<strong>
				{props.repository.viewerHasStarred ? ' unstar it' : ' star it'}
			</strong>{' '}
			?
		</button>
		<p>
			<strong>... which has the next Issues:</strong>
		</p>
		<ul>
			{props.repository.issues.edges.map((issue) => (
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

		{props.repository.issues.pageInfo.hasNextPage && (
			<button onClick={props.onFetchMoreIssues}>Load more issues</button>
		)}
	</div>
);

export default Repository;
