import type { Course, EditableRecord, Teacher } from '../types';

const validLevels = [
	'all_levels',
	'beginners',
	'intermediate',
	'intermediate_advanced',
	'advanced',
] as const;
const validRooms = ['Salle 1', 'Salle 2'] as const;
const validSlots = [
	['18:30', '19:30'],
	['19:30', '20:30'],
	['20:30', '21:30'],
	['21:30', '22:30'],
] as const;

function stripAccents(value: string) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

export function normalizeLevel(value: unknown) {
	if (typeof value !== 'string') return 'all_levels';
	if ((validLevels as readonly string[]).includes(value)) return value;

	const normalized = stripAccents(value);
	if (
		normalized.includes('debut') &&
		normalized.includes('inter') &&
		(normalized.includes('avance') ||
			normalized.includes('expert') ||
			normalized.includes('style'))
	) {
		return 'all_levels';
	}
	if (normalized.includes('debut') || normalized.includes('princip'))
		return 'beginners';
	if (normalized.includes('inter')) return 'intermediate';
	if (
		normalized.includes('avance') ||
		normalized.includes('advanced') ||
		normalized.includes('expert') ||
		normalized.includes('style')
	)
		return 'advanced';
	if (
		normalized.includes('tous') ||
		normalized.includes('todos') ||
		normalized.includes('all')
	)
		return 'all_levels';

	return 'all_levels';
}

export function normalizeLevels(value: unknown) {
	const source = Array.isArray(value) ? value : [value];
	const normalized = source.map(normalizeLevel);
	return [...new Set(normalized.length ? normalized : ['all_levels'])];
}

export function normalizeRoom(value: unknown) {
	if (typeof value !== 'string') return 'Salle 1';
	const trimmed = value.trim();
	if ((validRooms as readonly string[]).includes(trimmed)) return trimmed;

	const normalized = stripAccents(trimmed);
	if (normalized.includes('2')) return 'Salle 2';
	return 'Salle 1';
}

function normalizeTime(value: unknown) {
	return typeof value === 'string' ? value.trim().slice(0, 5) : '';
}

function normalizeSlot(startsAt: unknown, endsAt: unknown) {
	const start = normalizeTime(startsAt);
	const end = normalizeTime(endsAt);
	const exact = validSlots.find(
		([slotStart, slotEnd]) => slotStart === start && slotEnd === end,
	);
	if (exact) return { starts_at: exact[0], ends_at: exact[1] };

	const byStart = validSlots.find(([slotStart]) => slotStart === start);
	if (byStart) return { starts_at: byStart[0], ends_at: byStart[1] };

	return { starts_at: '18:30', ends_at: '19:30' };
}

export function normalizeCourseRecord<
	T extends Partial<Course> | EditableRecord,
>(course: T): T {
	const slot = normalizeSlot(course.starts_at, course.ends_at);
	return {
		...course,
		level: normalizeLevel(course.level),
		room: normalizeRoom(course.room),
		starts_at: slot.starts_at,
		ends_at: slot.ends_at,
	};
}

export function normalizeTeacherRecord<
	T extends Partial<Teacher> | EditableRecord,
>(teacher: T): T {
	return {
		...teacher,
		levels: normalizeLevels(teacher.levels),
	};
}
