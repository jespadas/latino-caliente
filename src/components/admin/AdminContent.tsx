import { useEffect, useState } from 'react';
import {
	CalendarDays,
	Camera,
	Edit3,
	Newspaper,
	PanelsTopLeft,
	ReceiptText,
	Save,
	Trash2,
	UserRound,
	X,
} from 'lucide-react';
import { selectOptions } from '../../data/forms';

function formatTime(value) {
	return String(value ?? '')
		.slice(0, 5)
		.replace(':', 'h');
}

function formatTimeSlot(item) {
	return `${formatTime(item.starts_at)} - ${formatTime(item.ends_at)}`;
}

function getLevelLabel(item, t) {
	return t.forms[item.level] ?? item.level ?? '';
}

function slugify(value) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function linksToText(value) {
	if (!Array.isArray(value)) return '';
	return value
		.map((item) => `${item.label ?? ''} | ${item.url ?? ''}`)
		.join('\n');
}

function textToLinks(value) {
	return value
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const [labelPart, ...urlParts] = line
				.split('|')
				.map((part) => part.trim());
			const url = urlParts.join('|') || labelPart;
			const label = urlParts.length ? labelPart || url : labelPart;
			return { label, url };
		})
		.filter((item) => item.label && /^https?:\/\//i.test(item.url));
}

export function Dashboard({ records, onJump, t }) {
	const metrics = [
		[
			t.admin.activeTeachers,
			records.teachers.filter((item) => item.is_active).length,
			UserRound,
			'teachers',
		],
		[
			t.admin.activeCourses,
			records.courses.filter((item) => item.is_active).length,
			CalendarDays,
			'courses',
		],
		[
			t.admin.onlineNews,
			records.news.filter((item) => item.status === 'published').length,
			Newspaper,
			'news',
		],
		[
			t.admin.activePricing,
			records['pricing-plans'].filter((item) => item.is_active).length,
			ReceiptText,
			'pricing-plans',
		],
		[
			t.admin.activePages,
			records.pages.filter((item) => item.status === 'published').length,
			PanelsTopLeft,
			'pages',
		],
	];

	return (
		<section className='metric-row'>
			{metrics.map(([label, value, Icon, key]) => (
				<button className='metric-card' key={label} onClick={() => onJump(key)}>
					<span>
						<Icon size={20} />
					</span>
					<p>{label}</p>
					<strong>{value}</strong>
				</button>
			))}
		</section>
	);
}

export function CourseDayCards({ items, onSelectDay, t }) {
	const days = t.weekdays.map((label, index) => {
		const weekday = index + 1;
		const dayItems = items.filter((item) => Number(item.weekday) === weekday);
		const activeItems = dayItems.filter((item) => item.is_active !== false);
		return {
			label,
			weekday,
			total: dayItems.length,
			active: activeItems.length,
		};
	});

	return (
		<div className='course-day-grid'>
			{days.map((day) => (
				<button
					className='course-day-card'
					key={day.weekday}
					onClick={() => onSelectDay(day.weekday)}
					type='button'
				>
					<span>{day.label.slice(0, 3)}</span>
					<strong>{day.label}</strong>
					<p>
						{day.total} {t.admin.records}
					</p>
					<small>
						{day.active} {t.admin.visible.toLowerCase()}
					</small>
				</button>
			))}
		</div>
	);
}
export function RecordTable({ items, resourceKey, onEdit, onRemove, t }) {
	const groupedItems =
		resourceKey === 'settings'
			? [...items].sort(
					(a, b) =>
						String(a.group_name ?? '').localeCompare(
							String(b.group_name ?? ''),
						) || Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
				)
			: items;

	return (
		<div className='table-wrap'>
			<table>
				<thead>
					<tr>
						<th>{t.admin.tableName}</th>
						<th>{t.admin.tableStatus}</th>
						<th>{t.admin.tableDetail}</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{groupedItems.map((item) => {
						const title = item.full_name ?? item.title ?? item.label;
						const courseLevel =
							resourceKey === 'courses' ? getLevelLabel(item, t) : '';
						const detail =
							resourceKey === 'courses'
								? `${item.room ?? '-'} · ${formatTimeSlot(item)}`
								: resourceKey === 'news'
									? `${item.category} · ${item.status}`
									: resourceKey === 'pages'
										? `${item.show_in_nav ? t.admin.preview.menu : t.admin.preview.page} · ${t.forms[item.status] ?? item.status}`
										: resourceKey === 'settings'
											? `${item.setting_key ?? ''} · ${t.forms[item.field_type] ?? item.field_type ?? ''}`
											: resourceKey === 'pricing-plans'
												? `${item.normal_price}${item.reduced_price ? ` · ${item.reduced_price}` : ''}`
												: (item.specialties ?? []).join(', ');
						const active =
							resourceKey === 'news' || resourceKey === 'pages'
								? item.status === 'published'
								: resourceKey === 'settings'
									? item.is_public
									: item.is_active;

						return (
							<tr key={item.id}>
								<td data-label={t.admin.tableName}>
									<div className='identity-cell'>
										{resourceKey !== 'courses' &&
										(item.photo_url ||
											item.cover_image_url ||
											item.hero_image_url ||
											(resourceKey === 'settings' &&
												item.field_type === 'image' &&
												item.value)) ? (
											<img
												src={
													item.photo_url ??
													item.cover_image_url ??
													item.hero_image_url ??
													item.value
												}
												alt=''
											/>
										) : (
											<span className='avatar-fallback'>
												{resourceKey === 'courses'
													? courseLevel?.slice(0, 1)
													: String(
															resourceKey === 'settings'
																? (item.group_name ?? title)
																: title,
														)?.slice(0, 1)}
											</span>
										)}
										<div>
											<strong>{title}</strong>
											<p>
												{resourceKey === 'courses' ? (
													<b>{courseLevel}</b>
												) : resourceKey === 'settings' ? (
													item.group_name
												) : (
													item.slug
												)}
											</p>
										</div>
									</div>
								</td>
								<td data-label={t.admin.tableStatus}>
									<span
										className={active ? 'status-chip active' : 'status-chip'}
									>
										{active ? t.admin.visible : t.admin.hidden}
									</span>
								</td>
								<td data-label={t.admin.tableDetail}>{detail}</td>
								<td data-label=''>
									<div className='row-actions'>
										<button
											className='icon-button'
											onClick={() => onEdit(item)}
											title={t.admin.edit}
										>
											<Edit3 size={16} />
										</button>
										<button
											className='icon-button danger'
											onClick={() => onRemove(item)}
											title={t.admin.delete}
										>
											<Trash2 size={16} />
										</button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

function settingValuePreview(item) {
	const value = String(item.value ?? '').trim();
	if (!value) return 'Sin valor';
	if (item.field_type === 'image') return 'Imagen configurada';
	if (item.field_type === 'file') return 'Archivo configurado';
	return value.length > 92 ? `${value.slice(0, 92)}...` : value;
}

function formatGroupLabel(value) {
	const label = String(value ?? 'general').trim() || 'general';
	return label
		.split(/[-_\s]+/)
		.map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
		.join(' ');
}

export function SettingsGroups({ items, onEdit, onRemove, t }) {
	const grouped = items
		.filter((item) => item.group_name !== 'pricing')
		.sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
		.reduce((groups, item) => {
			const groupName = String(item.group_name ?? 'general');
			groups[groupName] = [...(groups[groupName] ?? []), item];
			return groups;
		}, {});
	const groupNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

	if (!groupNames.length) {
		return (
			<div className='settings-empty'>
				<strong>{t.admin.noSelectionTitle}</strong>
				<p>Agrega parametros por grupo para configurar el sitio.</p>
			</div>
		);
	}

	return (
		<div className='settings-groups'>
			{groupNames.map((groupName) => (
				<section className='settings-group-card' key={groupName}>
					<div className='settings-group-card__header'>
						<span>{formatGroupLabel(groupName).slice(0, 1)}</span>
						<div>
							<h4>{formatGroupLabel(groupName)}</h4>
							<p>
								{grouped[groupName].length} {t.admin.records}
							</p>
						</div>
					</div>
					<div className='settings-group-list'>
						{grouped[groupName].map((item) => (
							<article className='settings-row-card' key={item.id}>
								<div>
									<strong>{item.label}</strong>
									<p>{item.setting_key}</p>
									<small>{settingValuePreview(item)}</small>
								</div>
								<span
									className={
										item.is_public ? 'status-chip active' : 'status-chip'
									}
								>
									{item.is_public ? t.admin.visible : t.admin.hidden}
								</span>
								<div className='row-actions'>
									<button
										className='icon-button'
										onClick={() => onEdit(item)}
										title={t.admin.edit}
									>
										<Edit3 size={16} />
									</button>
									<button
										className='icon-button danger'
										onClick={() => onRemove(item)}
										title={t.admin.delete}
									>
										<Trash2 size={16} />
									</button>
								</div>
							</article>
						))}
					</div>
				</section>
			))}
		</div>
	);
}

export function EditorPanel({
	value,
	resourceKey,
	resource,
	teacherOptions = [],
	t,
	onSave,
	onCancel,
	onChange,
	onUpload,
}) {
	console.log(
		'EditorPanel value',
		value,
		'resourceKey',
		resourceKey,
		'resource',
		resource,
	);
	if (!value) {
		return (
			<aside className='editor-panel empty-editor'>
				<Camera size={34} />
				<h3>{t.admin.noSelectionTitle}</h3>
				<p>{t.admin.noSelectionText}</p>
			</aside>
		);
	}

	function updateField(key, nextValue) {
		const next = { ...value, [key]: nextValue };
		if ((key === 'full_name' || key === 'title') && !value.id) {
			next.slug = slugify(nextValue);
		}
		onChange(next);
	}

	function updateFields(nextFields) {
		onChange({ ...value, ...nextFields });
	}

	return (
		<aside className='editor-panel'>
			<div className='panel-heading'>
				<div>
					<h3>{value.id ? t.admin.edit : t.admin.new}</h3>
					<p>{t.admin.nav[resourceKey]}</p>
				</div>
				<div className='editor-actions'>
					<button
						className='ghost-action small'
						onClick={onCancel}
						type='button'
					>
						<X size={16} />
						{t.admin.cancel}
					</button>
					<button
						className='primary-action small'
						onClick={() => onSave(value)}
						type='button'
					>
						<Save size={16} />
						{t.admin.save}
					</button>
				</div>
			</div>
			<div className='form-grid'>
				{resource.fields.map(([key, label, type]) => (
					<Field
						key={key}
						fieldKey={key}
						label={label}
						type={type}
						value={value[key]}
						record={value}
						teacherOptions={teacherOptions}
						t={t}
						onChange={updateField}
						onChangeMany={updateFields}
						onUpload={onUpload}
					/>
				))}
			</div>
			{resourceKey === 'pages' ? <PagePreview page={value} t={t} /> : null}
		</aside>
	);
}

function PagePreview({ page, t }) {
	const heroImage = page.hero_image_url || '/assets/latino-hero.png';
	const paragraphs = String(page.content ?? '')
		.split('\n')
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);
	const documents = Array.isArray(page.document_links)
		? page.document_links
		: [];
	const gallery = Array.isArray(page.gallery_image_urls)
		? page.gallery_image_urls
		: [];
	const supportLinks = Array.isArray(page.support_links)
		? page.support_links
		: [];

	return (
		<section className='page-preview' aria-label={t.admin.preview.label}>
			<div className='page-preview__toolbar'>
				<span>{t.admin.preview.label}</span>
				<strong>
					{page.status === 'published'
						? t.admin.preview.published
						: t.admin.preview.draft}
				</strong>
			</div>
			<article className='page-preview__canvas cms-public-page'>
				<header>
					<img src={heroImage} alt='' />
					<div>
						<h1>{page.title || t.admin.preview.placeholderTitle}</h1>
						{page.excerpt ? <p>{page.excerpt}</p> : null}
					</div>
				</header>
				<section className='cms-rich-content page-preview__content'>
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
									<span>PDF</span>
									<div>
										<strong>{document.label || t.public.documentReady}</strong>
										<small>{t.public.downloadDocument}</small>
									</div>
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
								<a
									href={link.url}
									key={link.url}
									target='_blank'
									rel='noreferrer'
								>
									{link.label}
								</a>
							))}
						</div>
					) : null}
					{gallery.length ? (
						<div className='cms-gallery'>
							{gallery.map((imageUrl) => (
								<img src={imageUrl} alt='' key={imageUrl} />
							))}
						</div>
					) : null}
				</section>
			</article>
		</section>
	);
}

function LinkListField({
	fieldKey,
	translatedLabel,
	value,
	onChange,
	onUpload,
}) {
	const [draft, setDraft] = useState(() => linksToText(value));
	const [isFocused, setIsFocused] = useState(false);
	const isDocumentList = fieldKey === 'document_links';

	useEffect(() => {
		if (!isFocused) {
			setDraft(linksToText(value));
		}
	}, [isFocused, value]);

	function handleChange(nextValue) {
		setDraft(nextValue);
		onChange(fieldKey, textToLinks(nextValue));
	}

	return (
		<label className='field full upload-field'>
			{translatedLabel}
			<textarea
				value={draft}
				onBlur={() => setIsFocused(false)}
				onFocus={() => setIsFocused(true)}
				onChange={(event) => handleChange(event.target.value)}
				rows={5}
				placeholder='https://... o Etiqueta | https://...'
			/>
			{isDocumentList ? (
				<input
					accept='application/pdf'
					onChange={(event) => onUpload(fieldKey, event.target.files?.[0])}
					type='file'
				/>
			) : null}
		</label>
	);
}

function Field({
	fieldKey,
	label,
	type,
	value,
	record,
	teacherOptions,
	t,
	onChange,
	onChangeMany,
	onUpload,
}) {
	const translatedLabel = t.forms[fieldKey] ?? label;

	if (type === 'textarea') {
		return (
			<label className='field full'>
				{translatedLabel}
				<textarea
					value={value ?? ''}
					onChange={(event) => onChange(fieldKey, event.target.value)}
					rows={4}
				/>
			</label>
		);
	}

	if (type === 'boolean') {
		return (
			<label className='toggle-field'>
				<input
					checked={Boolean(value)}
					onChange={(event) => onChange(fieldKey, event.target.checked)}
					type='checkbox'
				/>
				<span>{translatedLabel}</span>
			</label>
		);
	}

	if (type === 'tags') {
		return (
			<label className='field'>
				{translatedLabel}
				<input
					value={(value ?? []).join(', ')}
					onChange={(event) =>
						onChange(
							fieldKey,
							event.target.value
								.split(',')
								.map((item) => item.replace(/^\s+/, ''))
								.filter((item) => item.trim().length),
						)
					}
				/>
			</label>
		);
	}

	if (type === 'image-list') {
		const images = Array.isArray(value) ? value : [];

		return (
			<label className='field full upload-field'>
				{translatedLabel}
				{images.length ? (
					<div className='cms-image-list'>
						{images.map((imageUrl) => (
							<img src={imageUrl} alt='' key={imageUrl} />
						))}
					</div>
				) : null}
				<textarea
					value={images.join('\n')}
					onChange={(event) =>
						onChange(
							fieldKey,
							event.target.value
								.split('\n')
								.map((item) => item.trim())
								.filter(Boolean),
						)
					}
					rows={4}
					placeholder='https://...'
				/>
				<input
					accept='image/png,image/jpeg,image/webp'
					onChange={(event) => onUpload(fieldKey, event.target.files?.[0])}
					type='file'
				/>
			</label>
		);
	}

	if (type === 'link-list') {
		return (
			<LinkListField
				fieldKey={fieldKey}
				translatedLabel={translatedLabel}
				value={value}
				onChange={onChange}
				onUpload={onUpload}
			/>
		);
	}

	if (type === 'select') {
		return (
			<label className='field'>
				{translatedLabel}
				<select
					value={value ?? ''}
					onChange={(event) => onChange(fieldKey, event.target.value)}
				>
					{selectOptions[fieldKey].map((option) => (
						<option key={option} value={option}>
							{t.forms[option] ?? option}
						</option>
					))}
				</select>
			</label>
		);
	}

	if (type === 'setting-type-select') {
		return (
			<label className='field'>
				{translatedLabel}
				<select
					value={value ?? 'text'}
					onChange={(event) => onChange(fieldKey, event.target.value)}
				>
					{selectOptions.field_type.map((option) => (
						<option key={option} value={option}>
							{t.forms[option] ?? option}
						</option>
					))}
				</select>
			</label>
		);
	}

	if (type === 'setting-value') {
		const settingType = record?.field_type ?? 'text';

		if (settingType === 'textarea') {
			return (
				<label className='field full'>
					{translatedLabel}
					<textarea
						value={value ?? ''}
						onChange={(event) => onChange(fieldKey, event.target.value)}
						rows={5}
					/>
				</label>
			);
		}

		if (settingType === 'image' || settingType === 'file') {
			return (
				<label className='field full upload-field'>
					{translatedLabel}
					{settingType === 'image' && value ? (
						<img src={String(value)} alt='' />
					) : null}
					{settingType === 'file' && value ? (
						<a
							className='file-preview-link'
							href={String(value)}
							target='_blank'
							rel='noreferrer'
						>
							{String(value)}
						</a>
					) : null}
					<input
						type='url'
						value={value ?? ''}
						onChange={(event) => onChange(fieldKey, event.target.value)}
					/>
					<input
						accept={
							settingType === 'image'
								? 'image/png,image/jpeg,image/webp'
								: 'application/pdf'
						}
						onChange={(event) => onUpload(fieldKey, event.target.files?.[0])}
						type='file'
					/>
				</label>
			);
		}

		return (
			<label className='field full'>
				{translatedLabel}
				<input
					value={value ?? ''}
					onChange={(event) => onChange(fieldKey, event.target.value)}
					type={
						settingType === 'number'
							? 'number'
							: settingType === 'url'
								? 'url'
								: 'text'
					}
				/>
			</label>
		);
	}

	if (type === 'level-select') {
		return (
			<label className='field'>
				{translatedLabel}
				<select
					value={value ?? 'beginners'}
					onChange={(event) => onChange(fieldKey, event.target.value)}
				>
					{selectOptions.level.map((option) => (
						<option key={option} value={option}>
							{t.forms[option] ?? option}
						</option>
					))}
				</select>
			</label>
		);
	}

	if (type === 'levels-select') {
		const selectedValue = Array.isArray(value)
			? (value[0] ?? 'all_levels')
			: (value ?? 'all_levels');

		return (
			<label className='field'>
				{translatedLabel}
				<select
					value={selectedValue}
					onChange={(event) => onChange(fieldKey, [event.target.value])}
				>
					{selectOptions.levels.map((option) => (
						<option key={option} value={option}>
							{t.forms[option] ?? option}
						</option>
					))}
				</select>
			</label>
		);
	}

	if (type === 'time-slot-select') {
		const startsAt = String(record?.starts_at ?? '18:30').slice(0, 5);
		const endsAt = String(record?.ends_at ?? '19:30').slice(0, 5);
		const selectedValue = `${startsAt}-${endsAt}`;

		return (
			<label className='field'>
				{translatedLabel}
				<select
					value={selectedValue}
					onChange={(event) => {
						const [nextStart, nextEnd] = event.target.value.split('-');
						onChangeMany({ starts_at: nextStart, ends_at: nextEnd });
					}}
				>
					{selectOptions.time_slot.map(([start, end]) => (
						<option key={`${start}-${end}`} value={`${start}-${end}`}>
							{formatTime(start)} - {formatTime(end)}
						</option>
					))}
				</select>
			</label>
		);
	}

	if (type === 'teacher-select') {
		return (
			<label className='field'>
				{translatedLabel}
				<select
					value={value ?? ''}
					onChange={(event) => onChange(fieldKey, event.target.value || null)}
				>
					<option value=''>{t.forms.noTeacher}</option>
					{teacherOptions
						.filter((teacher) => teacher.is_active !== false)
						.map((teacher) => (
							<option key={teacher.id} value={teacher.id}>
								{teacher.full_name}
							</option>
						))}
				</select>
			</label>
		);
	}

	if (type === 'weekday-select') {
		return (
			<label className='field'>
				{translatedLabel}
				<select
					value={String(value ?? '1')}
					onChange={(event) => onChange(fieldKey, Number(event.target.value))}
				>
					{selectOptions.weekday.map(([optionValue], index) => (
						<option key={optionValue} value={optionValue}>
							{t.weekdays[index]}
						</option>
					))}
				</select>
			</label>
		);
	}

	if (type === 'image') {
		return (
			<label className='field full upload-field'>
				{translatedLabel}
				{value ? <img src={value} alt='' /> : null}
				<input
					type='url'
					value={value ?? ''}
					onChange={(event) => onChange(fieldKey, event.target.value)}
				/>
				<input
					accept='image/png,image/jpeg,image/webp'
					onChange={(event) => onUpload(fieldKey, event.target.files?.[0])}
					type='file'
				/>
			</label>
		);
	}

	if (type === 'file') {
		return (
			<label className='field full upload-field'>
				{translatedLabel}
				{value ? (
					<a
						className='file-preview-link'
						href={String(value)}
						target='_blank'
						rel='noreferrer'
					>
						{String(value)}
					</a>
				) : null}
				<input
					type='url'
					value={value ?? ''}
					onChange={(event) => onChange(fieldKey, event.target.value)}
				/>
				<input
					accept='application/pdf'
					onChange={(event) => onUpload(fieldKey, event.target.files?.[0])}
					type='file'
				/>
			</label>
		);
	}

	return (
		<label className='field'>
			{translatedLabel}
			<input
				value={value ?? ''}
				onChange={(event) => {
					const nextValue =
						type === 'number' ? Number(event.target.value) : event.target.value;
					onChange(fieldKey, nextValue);
				}}
				type={type}
			/>
		</label>
	);
}
