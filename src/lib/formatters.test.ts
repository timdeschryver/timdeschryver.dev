import { afterEach, describe, expect, it, vi } from 'vitest';
import { humanDate } from './formatters';

describe('humanDate', () => {
	afterEach(() => vi.restoreAllMocks());

	it('keeps date-only values on their declared calendar day', () => {
		const toLocaleDateString = vi
			.spyOn(Date.prototype, 'toLocaleDateString')
			.mockReturnValue('formatted date');

		expect(humanDate('2026-07-29')).toBe('formatted date');
		expect(toLocaleDateString).toHaveBeenCalledWith(undefined, {
			year: 'numeric',
			month: 'long',
			day: '2-digit',
			timeZone: 'UTC',
		});
	});
});
