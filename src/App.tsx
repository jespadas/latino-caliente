import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	AlertTriangle,
	BookOpen,
	CheckCircle2,
	Flame,
	LayoutDashboard,
	LogOut,
	Newspaper,
	PanelsTopLeft,
	Plus,
	ReceiptText,
	Search,
	Settings,
	X,
	UserRound,
} from 'lucide-react';
import { api } from './lib/api';
import {
	normalizeCourseRecord,
	normalizeTeacherRecord,
} from './lib/normalizeRecords';
import { resources } from './data/forms';
import { PublicSite } from './PublicSite';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DanceLoader } from './components/DanceLoader';
import { getInitialLanguage, translations } from './i18n';
import {
	CourseDayCards,
	Dashboard,
	EditorPanel,
	RecordTable,
	SettingsGroups,
} from './components/admin/AdminContent';
import type {
	AdminProfile,
	EditableRecord,
	LanguageCode,
	RecordsByResource,
	ResourceKey,
} from './types';

const navItems = [
	{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ key: 'teachers', label: 'Profesores', icon: UserRound },
	{ key: 'courses', label: 'Cursos', icon: BookOpen },
	{ key: 'news', label: 'Noticias', icon: Newspaper },
	{ key: 'pricing-plans', label: 'Formules', icon: ReceiptText },
	{ key: 'pages', label: 'Paginas', icon: PanelsTopLeft },
	{ key: 'settings', label: 'Parametros', icon: Settings },
] as const;

type AdminSection = ResourceKey | 'dashboard';
type ToastTone = 'success' | 'error' | 'info';
type ToastMessage = {
	id: number;
	message: string;
	tone: ToastTone;
};

function toInputDateTime(value?: unknown) {
	if (!value) return '';
	return new Date(String(value)).toISOString().slice(0, 16);
}

function fromInputDateTime(value?: unknown) {
	return value ? new Date(String(value)).toISOString() : null;
}

const optionalUrlFields = new Set([
	'photo_url',
	'instagram_url',
	'cover_image_url',
	'hero_image_url',
	'document_url',
]);
const timeFields = new Set(['starts_at', 'ends_at']);
const maxUploadFileSize = 15 * 1024 * 1024;

function getErrorMessage(error: unknown, fallback: string) {
	const message =
		error instanceof Error && error.message ? error.message : fallback;
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

function ToastStack({
	toasts,
	closeLabel,
	onDismiss,
}: {
	toasts: ToastMessage[];
	closeLabel: string;
	onDismiss: (id: number) => void;
}) {
	return (
		<div className='toast-stack' aria-live='polite' aria-atomic='true'>
			{toasts.map((toast) => {
				const Icon = toast.tone === 'error' ? AlertTriangle : CheckCircle2;
				return (
					<div
						className={`toast toast--${toast.tone}`}
						key={toast.id}
						role='status'
					>
						<Icon size={18} />
						<p>{toast.message}</p>
						<button
							type='button'
							onClick={() => onDismiss(toast.id)}
							aria-label={closeLabel}
						>
							<X size={15} />
						</button>
					</div>
				);
			})}
		</div>
	);
}

function LoginScreen({ language, onLanguageChange, onLogin, onToast, t }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError('');
		setLoading(true);

		try {
			const data = await api.login(email, password);
			onLogin(data);
			onToast(t.admin.toasts.loginSuccess, 'success');
		} catch (loginError) {
			const message = getErrorMessage(loginError, t.admin.toasts.loginError);
			setError(message);
			onToast(message, 'error');
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className='login-shell'>
			<section className='login-panel'>
				<div className='brand-lockup'>
					<span className='brand-mark'>
						<Flame size={28} />
					</span>
					<div>
						<h1>Latino Caliente</h1>
						<p>{t.admin.loginTitle}</p>
					</div>
				</div>
				<LanguageSwitcher
					language={language}
					onLanguageChange={onLanguageChange}
					variant='light'
				/>
				<form className='login-form' onSubmit={handleSubmit}>
					<label>
						{t.admin.email}
						<input
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							type='email'
							required
						/>
					</label>
					<label>
						{t.admin.password}
						<input
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							type='password'
							required
						/>
					</label>
					{error ? <p className='form-error'>{error}</p> : null}
					<button className='primary-action' disabled={loading} type='submit'>
						{loading ? (
							<DanceLoader label={t.admin.loggingIn} inline />
						) : (
							<>
								<CheckCircle2 size={18} />
								{t.admin.login}
							</>
						)}
					</button>
				</form>
			</section>
			<section className='login-art'>
				<div className='dance-card'>
					<p>Salsa · Bachata · Kizomba</p>
					<strong>Toulouse</strong>
				</div>
			</section>
		</main>
	);
}

function AppShell({ language, onLanguageChange, onLogout, onToast, t }) {
	const [active, setActive] = useState<AdminSection>('dashboard');
	const [records, setRecords] = useState<RecordsByResource>({
		teachers: [],
		courses: [],
		news: [],
		'pricing-plans': [],
		pages: [],
		settings: [],
	});
	const [selected, setSelected] = useState<EditableRecord | null>(null);
	const [query, setQuery] = useState('');
	const [courseDayFilter, setCourseDayFilter] = useState<number | null>(null);
	const [status, setStatus] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	async function loadAll() {
		setIsLoading(true);
		const [teachers, courses, news, pricingPlans, pages, settings] =
			await Promise.all([
				api.list('teachers'),
				api.list('courses'),
				api.list('news'),
				api.list('pricing-plans'),
				api.list('pages'),
				api.list('settings'),
			]);
		setRecords({
			teachers: teachers.map(normalizeTeacherRecord),
			courses: courses.map(normalizeCourseRecord),
			news,
			'pricing-plans': pricingPlans,
			pages,
			settings,
		});
		setIsLoading(false);
	}

	useEffect(() => {
		loadAll().catch((error) => {
			const message = getErrorMessage(error, t.admin.toasts.loadError);
			setStatus(message);
			onToast(message, 'error');
			setIsLoading(false);
		});
	}, [onToast, t.admin.toasts.loadError]);

	const visibleResource: ResourceKey =
		active === 'dashboard' ? 'teachers' : active;
	const resource = resources[visibleResource];
	const items = useMemo(() => {
		const source = records[visibleResource] ?? [];
		if (!query.trim()) return source;
		return source.filter((item) =>
			JSON.stringify(item).toLowerCase().includes(query.toLowerCase()),
		);
	}, [query, records, visibleResource]);
	const visibleItems = useMemo(
		() =>
			visibleResource === 'settings'
				? items.filter((item) => item.group_name !== 'pricing')
				: items,
		[items, visibleResource],
	);
	const courseVisibleItems = useMemo(
		() =>
			visibleResource === 'courses' && courseDayFilter
				? visibleItems.filter(
						(item) => Number(item.weekday) === courseDayFilter,
					)
				: visibleItems,
		[courseDayFilter, visibleItems, visibleResource],
	);
	const activeCourseDayLabel = courseDayFilter
		? t.weekdays[courseDayFilter - 1]
		: null;

	function changeSection(nextSection: AdminSection) {
		setStatus('');
		setActive(nextSection);
		setSelected(null);
		setCourseDayFilter(null);
		setQuery('');
	}

	function beginCreate() {
		setStatus('');
		const nextRecord = { ...resource.empty } as EditableRecord;
		if (visibleResource === 'courses' && courseDayFilter) {
			nextRecord.weekday = courseDayFilter;
		}
		setSelected(nextRecord);
	}

	function cancelEdit() {
		setStatus('');
		setSelected(null);
	}

	function beginEdit(item) {
		setStatus('');
		const normalized = { ...item };
		if (visibleResource === 'news' || visibleResource === 'pages') {
			normalized.published_at = toInputDateTime(item.published_at);
		}
		if (visibleResource === 'courses') {
			setSelected(normalizeCourseRecord(normalized));
			return;
		}
		if (visibleResource === 'teachers') {
			setSelected(normalizeTeacherRecord(normalized));
			return;
		}
		setSelected(normalized);
	}

	async function saveSelected(nextValue) {
		setStatus(t.admin.saving);
		try {
			let payload = { ...nextValue };

			if (visibleResource === 'news' || visibleResource === 'pages') {
				payload.published_at = fromInputDateTime(payload.published_at);
			}
			if (visibleResource === 'courses') {
				payload = normalizeCourseRecord(payload);
				payload.dance_style = String(payload.title ?? '').trim();
			}
			if (visibleResource === 'teachers') {
				payload = normalizeTeacherRecord(payload);
			}

			for (const key of Object.keys(payload)) {
				if (typeof payload[key] === 'string') {
					const trimmedValue = payload[key].trim();
					payload[key] =
						timeFields.has(key) && trimmedValue
							? trimmedValue.slice(0, 5)
							: trimmedValue || null;
				}

				if (Array.isArray(payload[key])) {
					payload[key] = payload[key]
						.map((item) => (typeof item === 'string' ? item.trim() : item))
						.filter((item) =>
							typeof item === 'string' ? item.length : Boolean(item),
						);
				}

				if (optionalUrlFields.has(key) && payload[key] === null) {
					delete payload[key];
				}
			}

			if (payload.id) {
				await api.update(visibleResource, payload.id, payload);
			} else {
				await api.create(visibleResource, payload);
			}

			await loadAll();
			setSelected(null);
			setStatus('');
			onToast(t.admin.toasts.saveSuccess, 'success');
		} catch (error) {
			const message = getErrorMessage(error, t.admin.toasts.saveError);
			setStatus(message);
			onToast(message, 'error');
		}
	}

	async function removeItem(item) {
		setStatus(t.admin.deleting);
		try {
			await api.remove(visibleResource, item.id);
			await loadAll();
			setStatus('');
			onToast(t.admin.toasts.deleteSuccess, 'success');
		} catch (error) {
			const message = getErrorMessage(error, t.admin.toasts.deleteError);
			setStatus(message);
			onToast(message, 'error');
		}
	}

	async function uploadImage(fieldKey, file) {
		if (!file) return;
		if (file.size > maxUploadFileSize) {
			const message = t.admin.toasts.uploadTooLarge;
			setStatus(message);
			onToast(message, 'error');
			return;
		}

		setStatus(t.admin.saving);
		try {
			const result = await api.upload(file);
			setSelected((current) => {
				if (fieldKey === 'gallery_image_urls') {
					const currentImages = Array.isArray(current?.gallery_image_urls)
						? current.gallery_image_urls
						: [];
					return {
						...(current ?? {}),
						gallery_image_urls: [...currentImages, result.publicUrl],
					};
				}

				if (fieldKey === 'document_links') {
					const currentDocuments = Array.isArray(current?.document_links)
						? current.document_links
						: [];
					return {
						...(current ?? {}),
						document_links: [
							...currentDocuments,
							{
								label: file.name.replace(/\.[^.]+$/, ''),
								url: result.publicUrl,
							},
						],
					};
				}

				return { ...(current ?? {}), [fieldKey]: result.publicUrl };
			});
			setStatus('');
			onToast(t.admin.toasts.uploadSuccess, 'success');
		} catch (error) {
			const message = getErrorMessage(error, t.admin.toasts.uploadError);
			setStatus(message);
			onToast(message, 'error');
		}
	}

	return (
		<main className='admin-shell'>
			<aside className='sidebar'>
				<div className='brand-lockup compact'>
					<span className='brand-mark'>
						<Flame size={22} />
					</span>
					<div>
						<h1>Latino Caliente</h1>
						<p>{t.admin.backoffice}</p>
					</div>
				</div>
				<nav>
					{navItems.map((item) => {
						const Icon = item.icon;
						return (
							<button
								key={item.key}
								className={active === item.key ? 'nav-item active' : 'nav-item'}
								onClick={() => changeSection(item.key)}
							>
								<Icon size={18} />
								{t.admin.nav[item.key] ?? item.label}
							</button>
						);
					})}
				</nav>
				<button className='ghost-action logout' onClick={onLogout}>
					<LogOut size={18} />
					{t.admin.logout}
				</button>
			</aside>
			<section className='workspace'>
				<header className='topbar'>
					<div>
						<p className='section-kicker'>{t.admin.contentManagement}</p>
						<h2>
							{active === 'dashboard'
								? t.admin.dashboard
								: t.admin.nav[visibleResource]}
						</h2>
					</div>
					<LanguageSwitcher
						language={language}
						onLanguageChange={onLanguageChange}
						variant='light'
					/>
					<label className='search-box'>
						<Search size={17} />
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder={t.admin.search}
						/>
					</label>
				</header>

				{isLoading ? (
					<DanceLoader label={t.admin.loading} />
				) : active === 'dashboard' ? (
					<Dashboard records={records} onJump={changeSection} t={t} />
				) : null}

				{!isLoading ? (
					<section
						className={
							selected ? 'content-grid content-grid--editing' : 'content-grid'
						}
					>
						<div className='list-panel'>
							<div className='panel-heading'>
								<div>
									<h3>{t.admin.nav[visibleResource]}</h3>
									<p>
										{visibleResource === 'courses' && activeCourseDayLabel
											? `${courseVisibleItems.length} ${t.admin.records} · ${activeCourseDayLabel}`
											: `${visibleItems.length} ${t.admin.records}`}
									</p>
								</div>
								<div className='panel-actions'>
									{visibleResource === 'courses' && courseDayFilter ? (
										<button
											className='ghost-action small'
											onClick={() => setCourseDayFilter(null)}
											type='button'
										>
											{t.admin.backToDays}
										</button>
									) : null}
									<button
										className='primary-action small'
										onClick={beginCreate}
										type='button'
									>
										<Plus size={17} />
										{t.admin.new}
									</button>
								</div>
							</div>
							{selected ? (
								<EditorPanel
									key={selected?.id ?? `new-${visibleResource}`}
									value={selected}
									resourceKey={visibleResource}
									resource={resource}
									teacherOptions={records.teachers}
									t={t}
									onSave={saveSelected}
									onCancel={cancelEdit}
									onChange={setSelected}
									onUpload={uploadImage}
								/>
							) : null}
							{visibleResource === 'settings' ? (
								<SettingsGroups
									items={visibleItems}
									onEdit={beginEdit}
									onRemove={removeItem}
									t={t}
								/>
							) : visibleResource === 'courses' && !courseDayFilter ? (
								<CourseDayCards
									items={visibleItems}
									onSelectDay={setCourseDayFilter}
									t={t}
								/>
							) : (
								<RecordTable
									items={courseVisibleItems}
									resourceKey={visibleResource}
									onEdit={beginEdit}
									onRemove={removeItem}
									t={t}
								/>
							)}
						</div>
					</section>
				) : null}
				{status ? <p className='status-line'>{status}</p> : null}
			</section>
		</main>
	);
}

export function App() {
	const isAdminRoute = window.location.pathname.startsWith('/admin');
	const [language, setLanguage] = useState<LanguageCode>(getInitialLanguage);
	const t = translations[language];
	const [admin, setAdmin] = useState<AdminProfile | null>(null);
	const [checking, setChecking] = useState(true);
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
		const id = Date.now() + Math.random();
		setToasts((current) => [...current, { id, message, tone }]);
		window.setTimeout(() => {
			setToasts((current) => current.filter((toast) => toast.id !== id));
		}, 4500);
	}, []);

	const dismissToast = useCallback((id: number) => {
		setToasts((current) => current.filter((toast) => toast.id !== id));
	}, []);

	useEffect(() => {
		document.documentElement.lang = language;
	}, [language]);

	function changeLanguage(nextLanguage: LanguageCode) {
		setLanguage(nextLanguage);
		window.localStorage.setItem('latino-language', nextLanguage);
		document.documentElement.lang = nextLanguage;
	}

	useEffect(() => {
		if (!isAdminRoute) {
			setChecking(false);
			return;
		}

		api
			.me()
			.then((data) => setAdmin(data))
			.catch(() => setAdmin(null))
			.finally(() => setChecking(false));
	}, [isAdminRoute]);

	async function logout() {
		try {
			await api.logout();
			setAdmin(null);
			showToast(t.admin.toasts.logoutSuccess, 'success');
		} catch (error) {
			showToast(getErrorMessage(error, t.admin.toasts.logoutError), 'error');
		}
	}

	if (checking) {
		return (
			<>
				<DanceLoader label={t.admin.loading} fullScreen />
				<ToastStack
					toasts={toasts}
					closeLabel={t.admin.closeToast}
					onDismiss={dismissToast}
				/>
			</>
		);
	}

	if (!isAdminRoute) {
		return (
			<PublicSite language={language} onLanguageChange={changeLanguage} t={t} />
		);
	}

	return (
		<>
			{admin ? (
				<AppShell
					language={language}
					onLanguageChange={changeLanguage}
					onLogout={logout}
					onToast={showToast}
					t={t}
				/>
			) : (
				<LoginScreen
					language={language}
					onLanguageChange={changeLanguage}
					onLogin={setAdmin}
					onToast={showToast}
					t={t}
				/>
			)}
			<ToastStack
				toasts={toasts}
				closeLabel={t.admin.closeToast}
				onDismiss={dismissToast}
			/>
		</>
	);
}
