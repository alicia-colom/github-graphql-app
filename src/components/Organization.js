import React from 'react';
import Repository from './Repository';

const Organization = (props) => {
	if (props.errors) {
		return (
			<p>
				<strong>Something went wrong:</strong>
				{props.errors.map((error) => error.message).join(', and also ')}
			</p>
		);
	}

	return (
		<div>
			<p>
				<strong>You have search the Organization: </strong>
				<a href={props.organization.url}>{props.organization.name}</a>
			</p>

			<Repository
				repository={props.organization.repository}
				onFetchMoreIssues={props.onFetchMoreIssues}
				onStarRepository={props.onStarRepository}
			/>
		</div>
	);
};

export default Organization;
