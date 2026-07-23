import { useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import {
	ArrowRight,
	ChevronLeft,
	Clock,
	FileDown,
	Flame,
	Instagram,
	Link as LinkIcon,
	Mail,
	MapPin,
	Phone,
	UserRound,
} from 'lucide-react';
import { api } from './lib/api';
import { normalizeCourseRecord } from './lib/normalizeRecords';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DanceLoader } from './components/DanceLoader';
import type {
	Course,
	LanguageCode,
	NewsPost,
	Page,
	PricingPlan,
	SiteSetting,
	Teacher,
} from './types';
import type { translations } from './i18n';

type Translation = (typeof translations)[LanguageCode];

type PublicSiteProps = {
	language: LanguageCode;
	onLanguageChange: (language: LanguageCode) => void;
	t: Translation;
};

type PublicData = {
	teachers: Teacher[];
	courses: Course[];
	news: NewsPost[];
	pricingPlans: PricingPlan[];
	pages: Page[];
	settings: SiteSetting[];
};

function dateLabel(value: string | null | undefined, language: LanguageCode) {
	if (!value) return 'Bient';
	return new Intl.DateTimeFormat(language, {
		day: '2-digit',
		month: 'short',
	}).format(new Date(value));
}

function useFallbackImage(event: SyntheticEvent<HTMLImageElement>) {
	event.currentTarget.src = '/assets/latino-hero.png';
}

function publishedPages(pages: Page[]) {
	return pages.filter((page) => page.status === 'published');
}

function activeCourses(courses: Course[]) {
	return courses.filter((course) => course.is_active !== false);
}

function publishedNews(news: NewsPost[]) {
	return news.filter((post) => post.status === 'published');
}

function activePricingPlans(plans: PricingPlan[]) {
	return plans.filter((plan) => plan.is_active !== false);
}

function publicSettings(settings: SiteSetting[]) {
	return settings.filter((setting) => setting.is_public !== false);
}

function navPages(pages: Page[]) {
	return publishedPages(pages)
		.filter((page) => page.show_in_nav)
		.sort(
			(a, b) =>
				(a.sort_order ?? 0) - (b.sort_order ?? 0) ||
				a.title.localeCompare(b.title),
		);
}

function localizedNavLabel(page: Page, t: Translation) {
	const labels: Record<string, string> = {
		cours: t.public.nav.courses,
		tarifs: t.public.nav.pricing,
		'les-profs': t.public.nav.teachers,
		actualites: t.public.nav.news,
		contact: t.public.nav.contact,
		'portes-ouvertes': t.public.nav.openHouse,
		'portes-ouvertes-2025': t.public.nav.openHouse,
		'porte-ouverte': t.public.nav.openHouse,
		'inscription-en-ligne': t.public.nav.registration,
	};

	return labels[page.slug] ?? page.title;
}

function localizedRegistrationLabel(
	siteSettings: Map<string, string>,
	t: Translation,
	language: LanguageCode,
) {
	const localizedValue = settingValue(
		siteSettings,
		`registration_button_label_${language}`,
		'',
	).trim();
	const value =
		localizedValue ||
		settingValue(siteSettings, 'registration_button_label', '').trim();
	const normalized = value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
	const defaultLabels = new Set([
		'inscription en ligne',
		'inscripcion en linea',
		'online registration',
	]);

	return !value || defaultLabels.has(normalized) ? t.public.trial : value;
}

function registrationButtonUrl(siteSettings: Map<string, string>) {
	return settingValue(siteSettings, 'registration_button_url', '').trim();
}

function isExternalUrl(value: string) {
	return /^https?:\/\//i.test(value);
}

function keepQuestionMark(value: string) {
	return value.replace(/\s+\?/g, '\u00a0?');
}

function newsPath(post: NewsPost) {
	return `/actualites/${post.slug ?? post.id}`;
}

function teacherPath(teacher: Teacher) {
	return `/les-profs/${teacher.slug ?? teacher.id}`;
}

function settingsMap(settings: SiteSetting[]) {
	return new Map(
		settings.map((setting) => [setting.setting_key, setting.value ?? '']),
	);
}

function settingValue(
	settings: Map<string, string>,
	key: string,
	fallback: string,
) {
	const value = settings.get(key)?.trim();
	return value || fallback;
}

function compactText(
	value: string | null | undefined,
	fallback: string,
	maxLength = 155,
) {
	const text = (value ?? '').replace(/\s+/g, ' ').trim() || fallback;
	return text.length > maxLength
		? `${text.slice(0, maxLength - 1).trim()}...`
		: text;
}

function absoluteUrl(value: string | null | undefined, siteUrl: string) {
	if (!value) return `${siteUrl}/assets/latino-hero.png`;
	try {
		return new URL(value, `${siteUrl}/`).href;
	} catch {
		return `${siteUrl}/assets/latino-hero.png`;
	}
}

function upsertMeta(
	selector: string,
	attribute: 'name' | 'property',
	key: string,
	content: string,
) {
	let element = document.head.querySelector<HTMLMetaElement>(selector);
	if (!element) {
		element = document.createElement('meta');
		element.setAttribute(attribute, key);
		document.head.appendChild(element);
	}
	element.content = content;
}

function upsertLink(rel: string, href: string) {
	let element = document.head.querySelector<HTMLLinkElement>(
		`link[rel="${rel}"]`,
	);
	if (!element) {
		element = document.createElement('link');
		element.rel = rel;
		document.head.appendChild(element);
	}
	element.href = href;
}

function upsertJsonLd(id: string, data: unknown) {
	let element = document.getElementById(id) as HTMLScriptElement | null;
	if (!element) {
		element = document.createElement('script');
		element.id = id;
		element.type = 'application/ld+json';
		document.head.appendChild(element);
	}
	element.textContent = JSON.stringify(data);
}

function pageDocuments(page: Page | NewsPost) {
	const documents = Array.isArray(page.document_links)
		? page.document_links
		: [];
	if (
		page.document_url &&
		!documents.some((item) => item.url === page.document_url)
	) {
		return [{ label: 'PDF', url: page.document_url }, ...documents];
	}
	return documents;
}

function formatScheduleTime(value: string) {
	const [hours, minutes = '00'] = value.split(':');
	return `${hours}h${minutes}`;
}

function normalizeScheduleTime(value: string) {
	const [hours, minutes = '00'] = value.split(':');
	return `${hours}:${minutes}`;
}

function courseRoom(course: Course) {
	const room = course.room?.trim();
	return room === 'Salle 1' || room === 'Salle 2' ? room : null;
}

function courseMatchesSlot(course: Course, startsAt: string, endsAt: string) {
	return (
		normalizeScheduleTime(course.starts_at) === startsAt &&
		normalizeScheduleTime(course.ends_at) === endsAt
	);
}

function localizedCourseText(
	course: Course,
	field: 'title' | 'level',
	language: LanguageCode,
	t: Translation,
) {
	const localizedKey = `${field}_${language}` as keyof Course;
	const localizedValue = course[localizedKey];
	if (typeof localizedValue === 'string' && localizedValue.trim()) {
		return localizedValue;
	}
	const fallback = field === 'title' ? course.title : course.level;
	if (field !== 'level') return fallback;
	return t.forms[fallback] ?? fallback;
}

function courseTeacherName(course: Course, teachersById: Map<string, Teacher>) {
	return (
		course.teacher?.full_name ??
		(course.teacher_id ? teachersById.get(course.teacher_id)?.full_name : null)
	);
}

const footerPageSlugs = ['mentions-legales', 'conditions-generales-de-vente'];
const sportigoScriptUrl =
	'https://standalone.api.sportigo.fr/component-standalone.js';
const sportigoAppointmentId = 'e77feb46-d12a-4ab4-a345-38820e6458b3';
const scheduleSlots = [
	['18:30', '19:30'],
	['19:30', '20:30'],
	['20:30', '21:30'],
	['21:30', '22:30'],
];
const sectionPageSlugs = new Set(['cours', 'tarifs', 'actualites']);
const configuredSiteUrl = String(import.meta.env.VITE_SITE_URL ?? '').trim();

function googleMapUrl(address: string) {
	return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

export function PublicSite({ language, onLanguageChange, t }: PublicSiteProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isSportigoOpen, setIsSportigoOpen] = useState(false);
	const [activeScheduleDay, setActiveScheduleDay] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [data, setData] = useState<PublicData>({
		teachers: [],
		courses: [],
		news: [],
		pricingPlans: [],
		pages: [],
		settings: [],
	});

	useEffect(() => {
		Promise.all([
			api.publicTeachers(),
			api.publicCourses(),
			api.publicNews(),
			api.publicPricingPlans(),
			api.publicPages(),
			api.publicSettings(),
		])
			.then(([teachers, courses, news, pricingPlans, pages, settings]) => {
				setData({
					teachers,
					courses: courses.map(normalizeCourseRecord),
					news,
					pricingPlans,
					pages,
					settings,
				});
			})
			.catch(() => {
				setData({
					teachers: [],
					courses: [],
					news: [],
					pricingPlans: [],
					pages: [],
					settings: [],
				});
			})
			.finally(() => setIsLoading(false));
	}, []);

	useEffect(() => {
		if (!isSportigoOpen) return;

		function initializeSportigo() {
			const container = document.getElementById('sportigo-container');
			const initComponent = (
				window as unknown as {
					initComponent?: (
						type: string,
						containerId: string,
						appointmentId: string,
						options: { colored: boolean; readonly: boolean },
					) => void;
				}
			).initComponent;

			if (!container || !initComponent) return;
			container.innerHTML = '';
			initComponent(
				'Appointment',
				'sportigo-container',
				sportigoAppointmentId,
				{
					colored: true,
					readonly: false,
				},
			);
		}

		const existingScript = document.querySelector<HTMLScriptElement>(
			`script[src="${sportigoScriptUrl}"]`,
		);

		if (existingScript) {
			window.setTimeout(initializeSportigo, 0);
			return;
		}

		const script = document.createElement('script');
		script.src = sportigoScriptUrl;
		script.async = true;
		script.onload = initializeSportigo;
		document.body.appendChild(script);
	}, [isSportigoOpen]);

	const coursesByDay = useMemo(
		() =>
			activeCourses(data.courses).sort(
				(a, b) =>
					a.weekday - b.weekday ||
					a.starts_at.localeCompare(b.starts_at) ||
					(a.room ?? '').localeCompare(b.room ?? '') ||
					(a.sort_order ?? 0) - (b.sort_order ?? 0) ||
					a.title.localeCompare(b.title),
			),
		[data.courses],
	);
	const teachersById = useMemo(
		() => new Map(data.teachers.map((teacher) => [teacher.id, teacher])),
		[data.teachers],
	);
	const activeTeachers = useMemo(
		() =>
			[...data.teachers]
				.filter((teacher) => teacher.is_active !== false)
				.sort(
					(a, b) =>
						(a.sort_order ?? 0) - (b.sort_order ?? 0) ||
						a.full_name.localeCompare(b.full_name),
				),
		[data.teachers],
	);
	const scheduleDays = [1, 2, 3, 4];
	const scheduleRooms = ['Salle 1', 'Salle 2'];
	const activeScheduleCourses = coursesByDay.filter(
		(course) => course.weekday === activeScheduleDay,
	);
	const publicNews = publishedNews(data.news);
	const publicPricingPlans = activePricingPlans(data.pricingPlans);
	const publicPages = publishedPages(data.pages);
	const pagesBySlug = new Map(publicPages.map((page) => [page.slug, page]));
	const activePageSlug = window.location.pathname.replace(/^\/+|\/+$/g, '');
	const isHomeRoute = !activePageSlug;
	const isCoursesPage = activePageSlug === 'cours';
	const isPricingPage = activePageSlug === 'tarifs';
	const isNewsListPage = activePageSlug === 'actualites';
	const isSectionPage = sectionPageSlugs.has(activePageSlug);
	const activeNewsSlug = activePageSlug.startsWith('actualites/')
		? activePageSlug.replace('actualites/', '')
		: '';
	const activeTeacherSlug = activePageSlug.startsWith('les-profs/')
		? activePageSlug.replace('les-profs/', '')
		: '';
	const activeNews = activeNewsSlug
		? publicNews.find(
				(post) => post.slug === activeNewsSlug || post.id === activeNewsSlug,
			)
		: null;
	const activeTeacher = activeTeacherSlug
		? activeTeachers.find(
				(teacher) =>
					teacher.slug === activeTeacherSlug ||
					teacher.id === activeTeacherSlug,
			)
		: null;
	const activePage =
		activePageSlug &&
		!activeNewsSlug &&
		!activeTeacherSlug &&
		!isSectionPage &&
		activePageSlug !== 'les-profs'
			? pagesBySlug.get(activePageSlug)
			: null;
	const isTeachersPage =
		activePageSlug === 'les-profs' && pagesBySlug.has('les-profs');
	const routeNotFound = Boolean(
		activePageSlug &&
		!isSectionPage &&
		!activePage &&
		!(activeNewsSlug && activeNews) &&
		!(activeTeacherSlug && activeTeacher) &&
		!isTeachersPage,
	);
	const pricingPage = pagesBySlug.get('tarifs');
	const pricingNotes = pricingPage?.content
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean) ?? [t.public.pricingMembership, t.public.pricingPayment];
	const siteSettings = useMemo(
		() => settingsMap(publicSettings(data.settings)),
		[data.settings],
	);
	const footerPages = footerPageSlugs
		.map((slug) => pagesBySlug.get(slug))
		.filter(Boolean) as Page[];
	const logoUrl = settingValue(
		siteSettings,
		'logo_url',
		'/assets/latino-caliente-logo-white.png',
	);
	const faviconUrl = settingValue(siteSettings, 'favicon_url', logoUrl);
	const siteName = settingValue(
		siteSettings,
		'site_name',
		'Latino Caliente Toulouse',
	);
	const siteUrl = settingValue(
		siteSettings,
		'site_url',
		configuredSiteUrl || window.location.origin,
	).replace(/\/+$/g, '');
	const contactHref = `/${pagesBySlug.get('contact')?.slug ?? 'contact'}`;
	const socialLinks = [
		['Instagram', settingValue(siteSettings, 'instagram_url', '')],
		['Facebook', settingValue(siteSettings, 'facebook_url', '')],
		['YouTube', settingValue(siteSettings, 'youtube_url', '')],
		['TikTok', settingValue(siteSettings, 'tiktok_url', '')],
	].filter(([, href]) => href);
	const navLinks = navPages(data.pages).map((page) => [
		`/${page.slug}`,
		localizedNavLabel(page, t),
	]);
	const sectionPage = isSectionPage
		? pagesBySlug.get(activePageSlug)
		: undefined;
	const seoSourcePage = activePage ?? sectionPage;
	const defaultSeoTitle = settingValue(
		siteSettings,
		'seo_default_title',
		'Latino Caliente | Cours de danse latino a Toulouse',
	);
	const defaultSeoDescription = settingValue(
		siteSettings,
		'seo_default_description',
		'Cours de salsa cubaine, bachata, kizomba, reggaeton, rumba, rueda de casino et danses latines a Toulouse pour tous niveaux.',
	);
	const rawSeoTitle = activeTeacher
		? `${activeTeacher.full_name} | Professeur de danse Latino Caliente Toulouse`
		: activeNews
			? activeNews.title
			: seoSourcePage?.seo_title || seoSourcePage?.title || defaultSeoTitle;
	const seoTitle = rawSeoTitle.includes('Latino Caliente')
		? rawSeoTitle
		: `${rawSeoTitle} | ${siteName}`;
	const seoDescription = activeTeacher
		? compactText(
				activeTeacher.description || activeTeacher.bio,
				`Decouvrez ${activeTeacher.full_name}, professeur de danse chez Latino Caliente Toulouse.`,
			)
		: activeNews
			? compactText(
					activeNews.excerpt || activeNews.content,
					defaultSeoDescription,
				)
			: compactText(
					seoSourcePage?.seo_description ||
						seoSourcePage?.excerpt ||
						seoSourcePage?.content,
					defaultSeoDescription,
				);
	const seoImage = absoluteUrl(
		activeTeacher?.photo_url ||
			activeNews?.cover_image_url ||
			seoSourcePage?.hero_image_url ||
			logoUrl,
		siteUrl,
	);
	const canonicalPath = activePageSlug ? `/${activePageSlug}` : '/';
	const canonicalUrl = new URL(canonicalPath, `${siteUrl}/`).href;
	const robotsValue = routeNotFound ? 'noindex,follow' : 'index,follow';
	const socialSameAs = socialLinks.map(([, href]) => href).filter(Boolean);
	const seoJsonLd = useMemo(
		() => ({
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': ['LocalBusiness', 'SportsActivityLocation'],
					'@id': `${siteUrl}/#organization`,
					name: siteName,
					url: siteUrl,
					logo: absoluteUrl(logoUrl, siteUrl),
					image: seoImage,
					description: defaultSeoDescription,
					telephone: settingValue(
						siteSettings,
						'phone_primary',
						'05 62 24 39 09',
					),
					email: settingValue(siteSettings, 'email', 'latino-caliente@live.fr'),
					address: {
						'@type': 'PostalAddress',
						streetAddress: '4 avenue des Etats-Unis',
						postalCode: '31200',
						addressLocality: 'Toulouse',
						addressCountry: 'FR',
					},
					sameAs: socialSameAs,
				},
				{
					'@type': 'WebSite',
					'@id': `${siteUrl}/#website`,
					name: siteName,
					url: siteUrl,
					inLanguage: language,
					publisher: { '@id': `${siteUrl}/#organization` },
				},
				{
					'@type': activeNews ? 'NewsArticle' : 'WebPage',
					'@id': `${canonicalUrl}#webpage`,
					url: canonicalUrl,
					name: seoTitle,
					description: seoDescription,
					image: seoImage,
					inLanguage: language,
					isPartOf: { '@id': `${siteUrl}/#website` },
					publisher: { '@id': `${siteUrl}/#organization` },
				},
				{
					'@type': 'BreadcrumbList',
					itemListElement: [
						{
							'@type': 'ListItem',
							position: 1,
							name: 'Accueil',
							item: `${siteUrl}/`,
						},
						...(activePageSlug
							? [
									{
										'@type': 'ListItem',
										position: 2,
										name:
											activeTeacher?.full_name ||
											activeNews?.title ||
											seoSourcePage?.title ||
											activePageSlug,
										item: canonicalUrl,
									},
								]
							: []),
					],
				},
			],
		}),
		[
			activeNews,
			activePageSlug,
			activeTeacher,
			canonicalUrl,
			defaultSeoDescription,
			language,
			logoUrl,
			seoDescription,
			seoImage,
			seoSourcePage,
			seoTitle,
			siteName,
			siteSettings,
			siteUrl,
			socialSameAs,
		],
	);

	useEffect(() => {
		let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
		if (!favicon) {
			favicon = document.createElement('link');
			favicon.rel = 'icon';
			document.head.appendChild(favicon);
		}
		favicon.type = 'image/png';
		favicon.href = faviconUrl;
	}, [faviconUrl]);

	useEffect(() => {
		document.documentElement.lang = language;
		document.title = seoTitle;
		upsertMeta(
			'meta[name="description"]',
			'name',
			'description',
			seoDescription,
		);
		upsertMeta('meta[name="robots"]', 'name', 'robots', robotsValue);
		upsertMeta('meta[property="og:title"]', 'property', 'og:title', seoTitle);
		upsertMeta(
			'meta[property="og:description"]',
			'property',
			'og:description',
			seoDescription,
		);
		upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
		upsertMeta('meta[property="og:image"]', 'property', 'og:image', seoImage);
		upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seoTitle);
		upsertMeta(
			'meta[name="twitter:description"]',
			'name',
			'twitter:description',
			seoDescription,
		);
		upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', seoImage);
		upsertLink('canonical', canonicalUrl);
		upsertJsonLd('latino-caliente-jsonld', seoJsonLd);
	}, [
		canonicalUrl,
		language,
		robotsValue,
		seoDescription,
		seoImage,
		seoJsonLd,
		seoTitle,
	]);

	function closeMenu() {
		setIsMenuOpen(false);
	}

	function openSportigo() {
		closeMenu();
		setIsSportigoOpen(true);
	}

	const registrationUrl = registrationButtonUrl(siteSettings);
	const registrationLabel = localizedRegistrationLabel(
		siteSettings,
		t,
		language,
	);

	if (isLoading) {
		return <DanceLoader label={t.public.loading} fullScreen />;
	}

	return (
		<main
			className={
				isHomeRoute ? 'public-site is-home' : 'public-site is-section-route'
			}
		>
			<header className={isMenuOpen ? 'public-nav menu-open' : 'public-nav'}>
				<a
					className='public-logo'
					href='/'
					aria-label={t.public.logoAria}
					onClick={closeMenu}
				>
					<img src={logoUrl} alt='Latino Caliente' />
				</a>
				<nav>
					{navLinks.map(([href, label]) => (
						<a href={href} key={href} onClick={closeMenu}>
							{label}
						</a>
					))}
				</nav>
				{registrationUrl ? (
					<a
						className='public-cta'
						href={registrationUrl}
						onClick={closeMenu}
						{...(isExternalUrl(registrationUrl)
							? { target: '_blank', rel: 'noreferrer' }
							: {})}
					>
						{registrationLabel}
					</a>
				) : (
					<button className='public-cta' type='button' onClick={openSportigo}>
						{registrationLabel}
					</button>
				)}
				<LanguageSwitcher
					language={language}
					onLanguageChange={onLanguageChange}
				/>
				<button
					className='mobile-menu'
					aria-expanded={isMenuOpen}
					aria-label={isMenuOpen ? t.public.closeMenu : t.public.openMenu}
					onClick={() => setIsMenuOpen((current) => !current)}
				>
					<span aria-hidden='true' />
					<span aria-hidden='true' />
					<span aria-hidden='true' />
				</button>
			</header>

			{isSportigoOpen ? (
				<section
					className='sportigo-modal'
					role='dialog'
					aria-modal='true'
					aria-label={t.public.trial}
				>
					<div className='sportigo-modal__panel'>
						<button
							className='sportigo-modal__close'
							type='button'
							onClick={() => setIsSportigoOpen(false)}
							aria-label={t.public.closeRegistration}
						>
							×
						</button>
						<div id='sportigo-container' />
					</div>
				</section>
			) : null}

			{activeNews ? (
				<NewsPublicPage post={activeNews} language={language} t={t} />
			) : activeTeacher ? (
				<TeacherPublicPage teacher={activeTeacher} t={t} />
			) : isTeachersPage ? (
				<TeachersPublicPage
					page={pagesBySlug.get('les-profs')}
					teachers={activeTeachers}
					t={t}
				/>
			) : activePage?.slug === 'contact' ? (
				<ContactPublicPage page={activePage} settings={siteSettings} t={t} />
			) : activePage ? (
				<CmsPublicPage page={activePage} t={t} />
			) : routeNotFound ? (
				<NotFoundPublicPage t={t} />
			) : (
				<>
					{isHomeRoute ? (
						<section className='public-hero' id='top'>
							<img
								className='hero-bg-photo'
								src='/assets/latino-hero.png'
								alt=''
								aria-hidden='true'
							/>
							<div className='hero-copy'>
								<h1>
									{t.public.heroTitle} <span>{t.public.heroCity}</span>
								</h1>
								<p className='hero-text'>{t.public.heroText}</p>
								<strong>{t.public.heroLine}</strong>
								<div className='hero-actions'>
									<a className='public-button' href='/cours'>
										{t.public.viewCourses} <ArrowRight size={18} />
									</a>
									<a className='public-button outline' href='/les-profs'>
										{t.public.meetTeachers}
									</a>
								</div>
							</div>
							<a
								className='scroll-cue'
								href='/cours'
								aria-label={t.public.scrollCourses}
							>
								<ArrowRight size={22} />
							</a>
						</section>
					) : null}

					{isHomeRoute ? (
						<section className='public-proof' aria-label={t.public.proofLabel}>
							<div>
								<strong>{t.public.proofDateValue}</strong>
								<span>{t.public.proofDateLabel}</span>
							</div>
							<div>
								<strong>{t.public.proofNightsValue}</strong>
								<span>{t.public.proofNightsLabel}</span>
							</div>
							<div>
								<strong>{t.public.proofStylesValue}</strong>
								<span>{t.public.proofStylesLabel}</span>
							</div>
						</section>
					) : null}

					{isHomeRoute || isCoursesPage ? (
						<section className='public-section courses-band' id='cours'>
							<div className='section-intro'>
								<p>{t.public.scheduleKicker}</p>
								<h2>{sectionPage?.title ?? t.public.coursesTitle}</h2>
								<span
									style={{ whiteSpace: 'pre-line' }}
									dangerouslySetInnerHTML={{
										__html: sectionPage?.excerpt ?? t.public.coursesText,
									}}
								></span>
							</div>
							<div className='schedule-planning'>
								<div className='schedule-tabs' role='tablist'>
									{scheduleDays.map((day) => (
										<button
											aria-selected={activeScheduleDay === day}
											className={
												activeScheduleDay === day ? 'active' : undefined
											}
											key={day}
											onClick={() => setActiveScheduleDay(day)}
											role='tab'
											type='button'
										>
											{t.weekdays[day - 1]}
										</button>
									))}
								</div>
								<div className='schedule-legend'>
									<span>{t.public.table.course}</span>
									<span>{t.public.table.level}</span>
									<span>{t.public.table.teacher}</span>
								</div>

								<div className='schedule-board'>
									<div className='schedule-board__day'>
										{t.weekdays[activeScheduleDay - 1]}
									</div>
									<div className='schedule-board__head'>
										<div>{t.public.table.time}</div>
										{scheduleRooms.map((room) => (
											<div key={room}>{room}</div>
										))}
									</div>
									{activeScheduleCourses.length ? (
										scheduleSlots.map(([startsAt, endsAt]) => {
											return (
												<div
													className='schedule-slot'
													key={`${startsAt}-${endsAt}`}
												>
													<div className='schedule-slot__time'>
														<span>{formatScheduleTime(startsAt)}</span>
														<small>-</small>
														<span>{formatScheduleTime(endsAt)}</span>
													</div>
													<div className='schedule-slot__courses'>
														{scheduleRooms.map((room) => {
															const courses = activeScheduleCourses.filter(
																(course) =>
																	courseRoom(course) === room &&
																	courseMatchesSlot(course, startsAt, endsAt),
															);

															return (
																<div className='schedule-slot__room' key={room}>
																	{courses.map((course) => {
																		return (
																			<article
																				className='schedule-course-card'
																				key={course.id}
																			>
																				{course.is_new ? (
																					<i className='schedule-new-ribbon'>
																						{t.forms.newBadge}
																					</i>
																				) : null}
																				<b>
																					{localizedCourseText(
																						course,
																						'title',
																						language,
																						t,
																					)}
																				</b>
																				<span>
																					{localizedCourseText(
																						course,
																						'level',
																						language,
																						t,
																					)}
																				</span>
																				<em>
																					{courseTeacherName(
																						course,
																						teachersById,
																					) ?? '-'}
																				</em>
																			</article>
																		);
																	})}
																</div>
															);
														})}
													</div>
												</div>
											);
										})
									) : (
										<div className='schedule-empty'>{t.public.noCourses}</div>
									)}
								</div>
							</div>
						</section>
					) : null}

					{isHomeRoute || isPricingPage ? (
						<section className='pricing-band' id='tarifs'>
							<div>
								<p>{t.public.pricingKicker}</p>
								<h2>{pricingPage?.title ?? t.public.pricingTitle}</h2>
								<span>{pricingPage?.excerpt ?? t.public.pricingText}</span>
								<div className='pricing-alerts'>
									{pricingNotes.map((note) => (
										<strong key={note}>{note}</strong>
									))}
								</div>
							</div>
							<div className='pricing-table'>
								<div className='pricing-row pricing-head'>
									<span>{t.public.pricingFormula}</span>
									<span>{t.public.pricingNormal}</span>
									<span>{t.public.pricingReduced}</span>
								</div>
								{publicPricingPlans.map((plan) => (
									<div className='pricing-row' key={plan.id}>
										<strong>
											{plan.title}
											<small>{plan.description}</small>
										</strong>
										<span
											className='price-value'
											data-label={t.public.pricingNormal}
										>
											{plan.normal_price}
										</span>
										<span data-label={t.public.pricingReduced}>
											{plan.reduced_price ?? '-'}
										</span>
									</div>
								))}
							</div>
						</section>
					) : null}

					{isHomeRoute ? (
						<section className='public-section teachers-band' id='les-profs'>
							<div className='section-heading-row'>
								<div>
									<p>{t.public.teamKicker}</p>
									<h2>{t.public.teamTitle}</h2>
								</div>
								<a href={contactHref}>
									{t.public.trialClass} <ArrowRight size={17} />
								</a>
							</div>
							<div className='teacher-grid-public'>
								{activeTeachers.slice(0, 4).map((teacher) => (
									<a
										className='teacher-public-card'
										href={teacherPath(teacher)}
										key={teacher.id}
									>
										<img
											src={teacher.photo_url ?? '/assets/latino-hero.png'}
											alt={teacher.full_name}
											onError={useFallbackImage}
										/>
										<div>
											<h3>{teacher.full_name}</h3>
											<strong>
												{(teacher.specialties ?? []).join(' · ') ||
													t.public.fallbackDance}
											</strong>
											<p>{teacher.bio}</p>
											<span className='read-more-link'>
												{t.public.viewProfile} <ArrowRight size={15} />
											</span>
										</div>
									</a>
								))}
							</div>
						</section>
					) : null}

					{isHomeRoute || isNewsListPage ? (
						<section className='public-section news-band' id='actualites'>
							<div className='section-heading-row'>
								<div>
									<p>{t.public.newsKicker}</p>
									<h2>{sectionPage?.title ?? t.public.newsTitle}</h2>
									{sectionPage?.excerpt ? (
										<span>{sectionPage.excerpt}</span>
									) : null}
								</div>
								<a href={contactHref}>
									{t.public.contactUs} <ArrowRight size={17} />
								</a>
							</div>
							<div className='news-grid-public'>
								{publicNews.slice(0, 3).map((post) => (
									<a
										className='news-public-card'
										href={newsPath(post)}
										key={post.id}
									>
										<div className='news-date'>
											{dateLabel(post.published_at, language)}
										</div>
										<img
											src={post.cover_image_url ?? '/assets/latino-hero.png'}
											alt={post.title}
											onError={useFallbackImage}
										/>
										<div>
											<span>{post.category}</span>
											<h3>{post.title}</h3>
											<p>{post.excerpt}</p>
											<strong className='read-more-link'>
												{t.public.readNews} <ArrowRight size={15} />
											</strong>
											<small>
												<MapPin size={14} /> {t.public.locationName}
											</small>
										</div>
									</a>
								))}
							</div>
						</section>
					) : null}

					{isHomeRoute ? (
						<section className='contact-band' id='contact'>
							<div>
								<p>{t.public.nav.contact}</p>
								<h2>{keepQuestionMark(t.public.contactTitle)}</h2>
								<span>{t.public.contactText}</span>
							</div>
							<ul>
								<li>
									<Phone size={18} />{' '}
									{settingValue(
										siteSettings,
										'phone_primary',
										'05 62 24 39 09',
									)}
								</li>
								<li>
									<Phone size={18} />{' '}
									{settingValue(
										siteSettings,
										'phone_secondary',
										'06 07 69 14 85',
									)}
								</li>
								<li>
									<Mail size={18} />{' '}
									{settingValue(
										siteSettings,
										'email',
										'latino-caliente@live.fr',
									)}
								</li>
								<li>
									<MapPin size={18} />{' '}
									{settingValue(siteSettings, 'address', t.public.address)}
								</li>
								<li>
									<Clock size={18} />{' '}
									{settingValue(
										siteSettings,
										'opening_hours',
										t.public.openingHours,
									)}
								</li>
							</ul>
							<div className='map-panel map-panel--embed'>
								<iframe
									title={settingValue(
										siteSettings,
										'map_title',
										t.public.mapTitle,
									)}
									src={googleMapUrl(
										settingValue(siteSettings, 'address', t.public.address),
									)}
									loading='lazy'
									referrerPolicy='no-referrer-when-downgrade'
								/>
							</div>
						</section>
					) : null}
				</>
			)}

			<footer className='public-footer'>
				<a className='public-logo small' href='#top'>
					<img src={logoUrl} alt='Latino Caliente' />
				</a>
				<p>
					© {settingValue(siteSettings, 'copyright_year', '2026')}{' '}
					{settingValue(siteSettings, 'site_name', 'Latino Caliente Toulouse')}{' '}
					- {settingValue(siteSettings, 'footer_text', t.public.footer)}
				</p>
				{footerPages.length ? (
					<nav className='footer-legal-links' aria-label={t.public.footerLegal}>
						{footerPages.map((page) => (
							<a href={`/${page.slug}`} key={page.id}>
								{page.title}
							</a>
						))}
					</nav>
				) : null}
				<div>
					{socialLinks.length ? (
						socialLinks.map(([label, href]) => (
							<a href={href} key={label} target='_blank' rel='noreferrer'>
								{label === 'Instagram' ? <Instagram size={20} /> : label}
							</a>
						))
					) : (
						<>
							<Instagram size={20} />
							<Flame size={20} />
							<UserRound size={20} />
						</>
					)}
				</div>
			</footer>
		</main>
	);
}

function NotFoundPublicPage({ t }: { t: Translation }) {
	return (
		<section className='cms-public-page not-found-page'>
			<div className='cms-public-header'>
				<p>{t.public.cmsHome}</p>
				<h1>{t.public.notFoundTitle}</h1>
				<span>{t.public.notFoundText}</span>
				<a className='public-button return-button' href='/'>
					<ChevronLeft size={18} /> {t.public.backHome}
				</a>
			</div>
		</section>
	);
}

function CmsPublicPage({ page, t }: { page: Page; t: Translation }) {
	return (
		<article className='cms-public-page'>
			<header>
				<img src={page.hero_image_url ?? '/assets/latino-hero.png'} alt='' />
				<div>
					<a className='detail-back-button detail-back-button--top' href='/'>
						<ChevronLeft size={18} /> {t.public.backHome}
					</a>
					<h1>{page.title}</h1>
					{page.excerpt ? <p>{page.excerpt}</p> : null}
				</div>
			</header>
			<PageCmsExtras page={page} t={t} />
		</article>
	);
}

function PageCmsExtras({ page, t }: { page: Page; t: Translation }) {
	const paragraphs = richParagraphs(page.content);
	const documents = pageDocuments(page);
	const supportLinks = Array.isArray(page.support_links)
		? page.support_links
		: [];
	const gallery = Array.isArray(page.gallery_image_urls)
		? page.gallery_image_urls
		: [];

	return (
		<section className='cms-rich-content'>
			{documents.length ? (
				<div className='cms-support-grid'>
					{documents.map((document) => (
						<a
							className='document-download-card'
							href={document.url}
							key={document.url}
							target='_blank'
							rel='noreferrer'
						>
							<span>
								<FileDown size={24} />
							</span>
							<div>
								<strong>{document.label || t.public.documentReady}</strong>
								<small>{t.public.downloadDocument}</small>
							</div>
							<ArrowRight size={18} />
						</a>
					))}
				</div>
			) : null}
			{paragraphs.map((paragraph, index) => (
				<p
					className={index === 0 ? 'cms-lead-paragraph' : undefined}
					key={paragraph}
				>
					{paragraph}
				</p>
			))}
			{supportLinks.length ? (
				<div className='cms-link-grid'>
					{supportLinks.map((link) => (
						<a href={link.url} key={link.url} target='_blank' rel='noreferrer'>
							<LinkIcon size={18} />
							<span>{link.label}</span>
						</a>
					))}
				</div>
			) : null}
			{gallery.length ? (
				<div className='cms-gallery'>
					{gallery.map((imageUrl) => (
						<a href={imageUrl} key={imageUrl} target='_blank' rel='noreferrer'>
							<img src={imageUrl} alt='' />
						</a>
					))}
				</div>
			) : null}
		</section>
	);
}

function ContactPublicPage({
	page,
	settings,
	t,
}: {
	page: Page;
	settings: Map<string, string>;
	t: Translation;
}) {
	const address = settingValue(settings, 'address', t.public.address);

	return (
		<article className='cms-public-page contact-detail-page'>
			<header>
				<img src={page.hero_image_url ?? '/assets/latino-hero.png'} alt='' />
				<div>
					<a className='detail-back-button detail-back-button--top' href='/'>
						<ChevronLeft size={18} /> {t.public.backHome}
					</a>
					<h1>{page.title}</h1>
					{page.excerpt ? <p>{page.excerpt}</p> : null}
				</div>
			</header>
			<section>
				<div className='contact-detail-grid'>
					<div>
						<p>{t.public.nav.contact}</p>
						<h2>{keepQuestionMark(t.public.contactTitle)}</h2>
						<span>{t.public.contactText}</span>
						<ul>
							<li>
								<Phone size={18} />{' '}
								{settingValue(settings, 'phone_primary', '05 62 24 39 09')}
							</li>
							<li>
								<Phone size={18} />{' '}
								{settingValue(settings, 'phone_secondary', '06 07 69 14 85')}
							</li>
							<li>
								<Mail size={18} />{' '}
								<a
									href={`mailto:${settingValue(settings, 'email', 'latino-caliente@live.fr')}`}
								>
									{settingValue(settings, 'email', 'latino-caliente@live.fr')}
								</a>
							</li>
							<li>
								<MapPin size={18} /> {address}
							</li>
							<li>
								<Clock size={18} />{' '}
								{settingValue(settings, 'opening_hours', t.public.openingHours)}
							</li>
						</ul>
					</div>
					<iframe
						title={settingValue(settings, 'map_title', t.public.mapTitle)}
						src={googleMapUrl(address)}
						loading='lazy'
						referrerPolicy='no-referrer-when-downgrade'
					/>
				</div>
				<PageCmsExtras page={page} t={t} />
			</section>
		</article>
	);
}

function richParagraphs(value?: string | null) {
	return String(value ?? '')
		.split('\n')
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);
}
function teacherLevelLabels(teacher: Teacher, t: Translation) {
	return (teacher.levels ?? [])
		.map((level) => t.forms[level] ?? level)
		.filter(Boolean);
}

function TeachersPublicPage({
	page,
	teachers,
	t,
}: {
	page?: Page;
	teachers: Teacher[];
	t: Translation;
}) {
	return (
		<article className='cms-public-page teachers-directory-page'>
			<header>
				<img src={page?.hero_image_url ?? '/assets/latino-hero.png'} alt='' />
				<div>
					<a className='detail-back-button detail-back-button--top' href='/'>
						<ChevronLeft size={18} /> {t.public.backHome}
					</a>
					<span>{t.public.teamKicker}</span>
					<h1>{page?.title ?? t.public.teamTitle}</h1>
					<p>{page?.excerpt ?? t.public.teachersPageText}</p>
				</div>
			</header>
			<section>
				<div className='teachers-directory-grid'>
					{teachers.map((teacher) => (
						<a
							className='teacher-directory-card'
							href={teacherPath(teacher)}
							key={teacher.id}
						>
							<img
								src={teacher.photo_url ?? '/assets/latino-hero.png'}
								alt={teacher.full_name}
								onError={useFallbackImage}
							/>
							<div>
								<h2>{teacher.full_name}</h2>
								<strong>
									{(teacher.specialties ?? []).join(' · ') ||
										t.public.fallbackDance}
								</strong>
								<p>{teacher.bio}</p>
								<span className='read-more-link'>
									{t.public.viewProfile} <ArrowRight size={15} />
								</span>
							</div>
						</a>
					))}
				</div>
			</section>
		</article>
	);
}

function TeacherPublicPage({
	teacher,
	t,
}: {
	teacher: Teacher;
	t: Translation;
}) {
	const levels = teacherLevelLabels(teacher, t);
	const descriptionParagraphs = richParagraphs(teacher.description);
	const bioParagraphs = richParagraphs(teacher.bio);

	return (
		<article className='cms-public-page teacher-detail-page'>
			<header>
				<img src={teacher.photo_url ?? '/assets/latino-hero.png'} alt='' />
				<div>
					<a
						className='detail-back-button detail-back-button--top'
						href='/les-profs'
					>
						<ChevronLeft size={18} /> {t.public.backTeachers}
					</a>
					<span>{t.public.teacherProfile}</span>
					<h1>{teacher.full_name}</h1>
					{(teacher.specialties ?? []).length ? (
						<p>{(teacher.specialties ?? []).join(' · ')}</p>
					) : null}
				</div>
			</header>
			<section>
				<div className='teacher-detail-layout'>
					<img
						className='teacher-detail-photo'
						src={teacher.photo_url ?? '/assets/latino-hero.png'}
						alt={teacher.full_name}
						onError={useFallbackImage}
					/>
					<div className='teacher-detail-copy'>
						{descriptionParagraphs.length || bioParagraphs.length ? (
							<div className='teacher-story-grid'>
								{bioParagraphs.length ? (
									<section className='teacher-story-card teacher-story-card--featured'>
										<span>Bio</span>
										{bioParagraphs.map((paragraph) => (
											<p key={paragraph}>{paragraph}</p>
										))}
									</section>
								) : null}
								{descriptionParagraphs.length ? (
									<section className='teacher-story-card'>
										<span>{t.public.teacherProfile}</span>
										{descriptionParagraphs.map((paragraph) => (
											<p key={paragraph}>{paragraph}</p>
										))}
									</section>
								) : null}
							</div>
						) : (
							<p className='teacher-empty-copy'>{t.public.teacherNoBio}</p>
						)}
						{(teacher.specialties ?? []).length ? (
							<div className='teacher-chip-list'>
								<strong>{t.forms.specialties}</strong>
								<div>
									{(teacher.specialties ?? []).map((specialty) => (
										<span key={specialty}>{specialty}</span>
									))}
								</div>
							</div>
						) : null}
						{levels.length ? (
							<div className='teacher-chip-list'>
								<strong>{t.forms.levels}</strong>
								<div>
									{levels.map((level) => (
										<span key={level}>{level}</span>
									))}
								</div>
							</div>
						) : null}
						{teacher.instagram_url ? (
							<a
								className='public-button teacher-social-link'
								href={teacher.instagram_url}
								target='_blank'
								rel='noreferrer'
							>
								<Instagram size={18} /> Instagram
							</a>
						) : null}
					</div>
				</div>
			</section>
		</article>
	);
}

function NewsPublicPage({
	post,
	language,
	t,
}: {
	post: NewsPost;
	language: LanguageCode;
	t: Translation;
}) {
	const content = post.content || post.excerpt || '';
	const paragraphs = richParagraphs(content);
	const documents = pageDocuments(post);
	const supportLinks = Array.isArray(post.support_links)
		? post.support_links
		: [];
	const gallery = Array.isArray(post.gallery_image_urls)
		? post.gallery_image_urls
		: [];

	return (
		<article className='cms-public-page news-detail-page'>
			<header>
				<img src={post.cover_image_url ?? '/assets/latino-hero.png'} alt='' />
				<div>
					<a
						className='detail-back-button detail-back-button--top'
						href='/actualites'
					>
						<ChevronLeft size={18} /> {t.public.backNews}
					</a>
					<span>
						{dateLabel(post.published_at, language)} ·{' '}
						{t.forms[post.category ?? 'news'] ?? post.category}
					</span>
					<h1>{post.title}</h1>
					{post.excerpt ? <p>{post.excerpt}</p> : null}
				</div>
			</header>
			<section className='cms-rich-content'>
				<img
					className='detail-main-image'
					src={post.cover_image_url ?? '/assets/latino-hero.png'}
					alt={post.title}
				/>
				{paragraphs.map((paragraph, index) => (
					<p
						className={index === 0 ? 'cms-lead-paragraph' : undefined}
						key={paragraph}
					>
						{paragraph}
					</p>
				))}
				{documents.length ? (
					<div className='cms-support-grid'>
						{documents.map((document) => (
							<a
								className='document-download-card'
								href={document.url}
								key={document.url}
								target='_blank'
								rel='noreferrer'
							>
								<span>
									<FileDown size={24} />
								</span>
								<div>
									<strong>{document.label || t.public.documentReady}</strong>
									<small>{t.public.downloadDocument}</small>
								</div>
								<ArrowRight size={18} />
							</a>
						))}
					</div>
				) : null}
				{supportLinks.length ? (
					<div className='cms-link-grid'>
						{supportLinks.map((link) => (
							<a
								href={link.url}
								key={link.url}
								target='_blank'
								rel='noreferrer'
							>
								<LinkIcon size={18} />
								<span>{link.label}</span>
							</a>
						))}
					</div>
				) : null}
				{gallery.length ? (
					<div className='cms-gallery'>
						{gallery.map((imageUrl) => (
							<a
								href={imageUrl}
								key={imageUrl}
								target='_blank'
								rel='noreferrer'
							>
								<img src={imageUrl} alt='' />
							</a>
						))}
					</div>
				) : null}
				<a className='public-button detail-back-button' href='/actualites'>
					{t.public.backNews}
				</a>
			</section>
		</article>
	);
}
