<script>
	import { variables } from '$lib/variables';
</script>

<div>
	<a
		href="https://github.com/timdeschryver/timdeschryver.dev/commit/{variables.hash}"
		rel="noreferrer"
		target="_blank">{variables.hash?.substring(0, 6) ?? 'local'}</a
	>
	hosted on
	<a
		href="https://azure.microsoft.com/en-us/services/app-service/static/#features?WT.mc_id={variables.creator_id}"
		rel="noreferrer"
		target="_blank">Azure</a
	>.
</div>
