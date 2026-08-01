export default function codeBlockLifeCycle(trigger?: () => unknown) {
	let codeTabs: HTMLElement[] = [];

	$effect(() => {
		trigger?.();
		codeTabs = [...document.querySelectorAll<HTMLElement>('.code-group-tab')];
		codeTabs.forEach((pre) => pre.addEventListener('click', codeTabClick));
		return () => {
			codeTabs.forEach((pre) => pre.removeEventListener('click', codeTabClick));
		};
	});

	function codeTabClick(e: PointerEvent) {
		if (e.currentTarget instanceof HTMLElement) {
			const target = e.currentTarget;
			if (target.classList.contains('active')) {
				return;
			}
			const id = target.dataset.id;
			if (!id) return;

			const code = document.querySelector<HTMLElement>(`.code-group-code[data-id="${id}"]`);
			if (code instanceof HTMLElement) {
				const group = code.parentElement;
				if (!group) return;

				const currentVisible = group.querySelector<HTMLElement>(`.code-group-code:not([hidden])`);
				const currentActive = group.querySelector<HTMLElement>(`.code-group-tab.active`);
				if (!currentVisible || !currentActive) return;

				code.removeAttribute('hidden');
				target.classList.add('active');

				currentVisible.setAttribute('hidden', '');
				currentActive.classList.remove('active');
			}
		}
	}
}
