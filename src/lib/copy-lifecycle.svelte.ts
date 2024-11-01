import { onDestroy } from 'svelte';

export default function copyLifeCycle() {
	let copyButtons: HTMLElement[] = [];

	$effect(() => {
		copyButtons.forEach((pre) => pre.removeEventListener('click', copyCodeOnClick));
		copyButtons = [...(document.querySelectorAll('.copy-code') as unknown as HTMLElement[])];
		copyButtons.forEach((pre) => pre.addEventListener('click', copyCodeOnClick));
	});

	onDestroy(() => {
		copyButtons.forEach((pre) => pre.removeEventListener('click', copyCodeOnClick));
	});

	function copyCodeOnClick(e: PointerEvent) {
		if (e.target instanceof HTMLElement) {
			const target = e.target;
			const ref = target.getAttribute('data-ref');
			const code = document.querySelector(`[id="${ref}"] code`);
			if (code instanceof HTMLElement) {
				navigator.clipboard.writeText(code.innerText).then(() => {
					target.innerHTML = 'assignment_turned_in';
					target.classList.add('success');
					setTimeout(() => {
						target.classList.remove('success');
						target.innerHTML = 'content_paste';
					}, 1000);
				});
			}
		}
	}
}
