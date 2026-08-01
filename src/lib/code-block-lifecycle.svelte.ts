export default function codeBlockLifeCycle(trigger?: () => unknown) {
	let codeTabs: HTMLElement[] = [];

	$effect(() => {
		trigger?.();
		codeTabs = [...document.querySelectorAll<HTMLElement>('.code-group-tab')];
		codeTabs.forEach((tab) => {
			tab.addEventListener('click', codeTabClick);
			tab.addEventListener('keydown', codeTabKeydown);
		});
		return () => {
			codeTabs.forEach((tab) => {
				tab.removeEventListener('click', codeTabClick);
				tab.removeEventListener('keydown', codeTabKeydown);
			});
		};
	});

	function codeTabClick(e: Event) {
		if (e.currentTarget instanceof HTMLElement) {
			activateTab(e.currentTarget);
		}
	}

	function codeTabKeydown(e: KeyboardEvent) {
		if (!(e.currentTarget instanceof HTMLElement)) return;
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;

		const tabs = [
			...(e.currentTarget
				.closest('.code-group-tabs')
				?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []),
		];
		if (!tabs.length) return;

		e.preventDefault();
		const currentIndex = tabs.indexOf(e.currentTarget);
		const nextIndex =
			e.key === 'Home'
				? 0
				: e.key === 'End'
					? tabs.length - 1
					: (currentIndex + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
		const nextTab = tabs[nextIndex];
		activateTab(nextTab);
		nextTab.focus();
	}

	function activateTab(target: HTMLElement) {
		if (target.classList.contains('active')) return;
		const id = target.dataset.id;
		const group = target.closest<HTMLElement>('.code-group');
		if (!id || !group) return;

		const code = group.querySelector<HTMLElement>(`.code-group-code[data-id="${id}"]`);
		const currentVisible = group.querySelector<HTMLElement>('.code-group-code:not([hidden])');
		const currentActive = group.querySelector<HTMLElement>('.code-group-tab.active');
		if (!code || !currentVisible || !currentActive) return;

		currentVisible.setAttribute('hidden', '');
		currentActive.classList.remove('active');
		currentActive.setAttribute('aria-selected', 'false');
		currentActive.setAttribute('tabindex', '-1');

		code.removeAttribute('hidden');
		target.classList.add('active');
		target.setAttribute('aria-selected', 'true');
		target.setAttribute('tabindex', '0');
	}
}
