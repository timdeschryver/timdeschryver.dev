export default function copyLifeCycle(trigger?: () => unknown) {
	let copyButtons: HTMLElement[] = [];

	$effect(() => {
		trigger?.();
		copyButtons = [...(document.querySelectorAll('.copy-code') as unknown as HTMLElement[])];
		copyButtons.forEach((pre) => pre.addEventListener('click', copyCodeOnClick));
		return () => {
			copyButtons.forEach((pre) => pre.removeEventListener('click', copyCodeOnClick));
		};
	});

	function copyCodeOnClick(e: PointerEvent) {
		const target = e.currentTarget as HTMLButtonElement;
		const ref = target.getAttribute('data-ref');
		const code = document.querySelector(`[id="${ref}"] code`);
		if (code instanceof HTMLElement) {
			navigator.clipboard.writeText(code.innerText).then(() => {
				target.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
				target.classList.add('success');
				setTimeout(() => {
					target.classList.remove('success');
					target.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>';
				}, 1000);
			});
		}
	}
}
