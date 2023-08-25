import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Host from './Host.svelte';

it('renders host', () => {
	render(Host);
	expect(screen.getByText(/Azure/)).toBeDefined();
});
