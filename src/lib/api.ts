import {
	normalizeCourseRecord,
	normalizeTeacherRecord,
} from './normalizeRecords';
import { storageBucket, supabase } from './supabase';
import type {
	AdminProfile,
	Course,
	EditableRecord,
	NewsPost,
	Page,
	PricingPlan,
	ResourceKey,
	SiteSetting,
	Teacher,
	UploadResult,
} from '../types';

const resourceTables: Record<ResourceKey, string> = {
	teachers: 'teachers',
	courses: 'courses',
	news: 'news_posts',
	'pricing-plans': 'pricing_plans',
	pages: 'pages',
	settings: 'site_settings',
};

const resourceOrder: Record<ResourceKey, string> = {
	teachers: 'sort_order',
	courses: 'weekday',
	news: 'created_at',
	'pricing-plans': 'sort_order',
	pages: 'sort_order',
	settings: 'group_name',
};

const allowedUploadTypes = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'application/pdf',
]);

function getErrorMessage(error: unknown, fallback = 'Request failed') {
	const message =
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
			? error.message
			: fallback;
	console.log('Error message:', message);
	const normalized = message.toLowerCase();

	if (normalized.includes('courses_active_slot_unique')) {
		return 'Ya existe un curso activo para ese dia, horario y sala. Cambia el dia, la hora, la sala o desactiva el curso existente antes de guardar.';
	}

	if (normalized.includes('courses_level_allowed')) {
		return 'El nivel seleccionado no es valido. Elige un nivel de la lista y vuelve a guardar.';
	}

	if (
		normalized.includes('courses_weekday_allowed') ||
		normalized.includes('weekday')
	) {
		return 'El dia seleccionado no es valido. Solo se permiten cursos de lunes a jueves.';
	}

	if (normalized.includes('duplicate key')) {
		return 'Ya existe un registro con esos datos. Cambia el valor repetido antes de guardar.';
	}

	if (normalized.includes('violates check constraint')) {
		return 'Hay un valor no permitido en el formulario. Revisa los campos seleccionados y vuelve a guardar.';
	}

	if (
		normalized.includes('violates not-null constraint') ||
		normalized.includes('null value')
	) {
		return 'Falta completar un campo obligatorio antes de guardar.';
	}

	if (normalized.includes('invalid login credentials')) {
		return 'Email o contrasena incorrectos.';
	}

	return message;
}

function raise(error: unknown, fallback?: string): never {
	throw new Error(getErrorMessage(error, fallback));
}

function sanitizePayload(body: EditableRecord) {
	const payload = { ...body };
	delete payload.id;
	delete payload.teacher;
	delete payload.created_at;
	delete payload.updated_at;
	return payload;
}

function normalizeRows(resource: ResourceKey, rows: EditableRecord[]) {
	if (resource === 'teachers') return rows.map(normalizeTeacherRecord);
	if (resource === 'courses') return rows.map(normalizeCourseRecord);
	return rows;
}

async function getAdminProfile(): Promise<AdminProfile> {
	const { data: userData, error: userError } = await supabase.auth.getUser();
	if (userError || !userData.user) raise(userError, 'Invalid session');

	const { data, error } = await supabase
		.from('admin_profiles')
		.select('user_id, display_name, role, is_active')
		.eq('user_id', userData.user.id)
		.eq('is_active', true)
		.maybeSingle();

	if (error) raise(error, 'Unable to verify admin profile');
	if (!data) throw new Error('Admin access required');

	return {
		user_id: data.user_id,
		email: userData.user.email ?? null,
		full_name: data.display_name ?? null,
		role: data.role,
		is_active: data.is_active,
	};
}

export const api = {
	publicTeachers: async () => {
		const { data, error } = await supabase
			.from('teachers')
			.select(
				'id, full_name, slug, bio, description, specialties, levels, photo_url, instagram_url, sort_order, is_active',
			)
			.eq('is_active', true)
			.order('sort_order')
			.order('full_name');
		if (error) raise(error);
		return ((data ?? []) as Teacher[]).map(normalizeTeacherRecord);
	},
	publicCourses: async () => {
		const { data, error } = await supabase
			.from('courses')
			.select('*, teacher:teachers(id, full_name, slug, photo_url)')
			.eq('is_active', true)
			.order('weekday')
			.order('starts_at')
			.order('room')
			.order('sort_order')
			.order('title');
		if (error) raise(error);
		return ((data ?? []) as Course[]).map(normalizeCourseRecord);
	},
	publicNews: async () => {
		const { data, error } = await supabase
			.from('news_posts')
			.select('*')
			.eq('status', 'published')
			.order('published_at', { ascending: false, nullsFirst: false });
		if (error) raise(error);
		return (data ?? []) as NewsPost[];
	},
	publicPricingPlans: async () => {
		const { data, error } = await supabase
			.from('pricing_plans')
			.select('*')
			.eq('is_active', true)
			.order('sort_order')
			.order('title');
		if (error) raise(error);
		return (data ?? []) as PricingPlan[];
	},
	publicPages: async () => {
		const { data, error } = await supabase
			.from('pages')
			.select('*')
			.eq('status', 'published')
			.order('sort_order')
			.order('title');
		if (error) raise(error);
		return (data ?? []) as Page[];
	},
	publicPage: async (slug: string) => {
		const { data, error } = await supabase
			.from('pages')
			.select('*')
			.eq('status', 'published')
			.eq('slug', slug)
			.single();
		if (error) raise(error);
		return data as Page;
	},
	publicSettings: async () => {
		const { data, error } = await supabase
			.from('site_settings')
			.select('*')
			.eq('is_public', true)
			.order('group_name')
			.order('sort_order')
			.order('label');
		if (error) raise(error);
		return (data ?? []) as SiteSetting[];
	},
	login: async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (error) raise(error, 'Invalid email or password');
		return getAdminProfile();
	},
	logout: async () => {
		const { error } = await supabase.auth.signOut();
		if (error) raise(error);
	},
	me: getAdminProfile,
	list: async (resource: ResourceKey) => {
		const table = resourceTables[resource];
		const { data, error } = await supabase
			.from(table)
			.select('*')
			.order(resourceOrder[resource]);
		if (error) raise(error);
		return normalizeRows(resource, (data ?? []) as EditableRecord[]);
	},
	create: async (resource: ResourceKey, body: EditableRecord) => {
		const table = resourceTables[resource];
		const { data, error } = await supabase
			.from(table)
			.insert(sanitizePayload(body))
			.select('*')
			.single();
		if (error) raise(error);
		return data as EditableRecord;
	},
	update: async (resource: ResourceKey, id: string, body: EditableRecord) => {
		const table = resourceTables[resource];
		const { data, error } = await supabase
			.from(table)
			.update(sanitizePayload(body))
			.eq('id', id)
			.select('*')
			.single();
		if (error) raise(error);
		return data as EditableRecord;
	},
	remove: async (resource: ResourceKey, id: string) => {
		const table = resourceTables[resource];
		const { error } = await supabase.from(table).delete().eq('id', id);
		if (error) raise(error);
	},
	upload: async (file: File): Promise<UploadResult> => {
		if (!allowedUploadTypes.has(file.type)) {
			throw new Error('Only JPG, PNG, WEBP and PDF files are allowed');
		}

		const { data: sessionData, error: sessionError } =
			await supabase.auth.getSession();
		const userId = sessionData.session?.user.id;
		if (sessionError || !userId) raise(sessionError, 'Missing admin session');

		const extension =
			file.name.split('.').pop()?.toLowerCase() ||
			file.type.split('/').pop() ||
			'file';
		const path = `${userId}/${crypto.randomUUID()}.${extension}`;
		const { error } = await supabase.storage
			.from(storageBucket)
			.upload(path, file, {
				contentType: file.type,
				upsert: false,
			});
		if (error) raise(error);

		const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
		return { path, publicUrl: data.publicUrl };
	},
};
