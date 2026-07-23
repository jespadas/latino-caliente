export const resources = {
  teachers: {
    label: 'Profesores',
    singular: 'profesor',
    fields: [
      ['full_name', 'Nombre completo', 'text'],
      ['slug', 'Slug', 'text'],
      ['bio', 'Biografia', 'textarea'],
      ['description', 'Description', 'textarea'],
      ['specialties', 'Especialidades', 'tags'],
      ['levels', 'Niveles', 'levels-select'],
      ['photo_url', 'Foto', 'image'],
      ['instagram_url', 'Instagram', 'url'],
      ['sort_order', 'Orden', 'number'],

      ['is_active', 'Activo', 'boolean']
    ],
    empty: {
      full_name: '',
      slug: '',
      bio: '',
      specialties: [],
      levels: [],
      photo_url: '',
      instagram_url: '',
      sort_order: 0,
      is_active: true
    }
  },
  courses: {
    label: 'Cursos',
    singular: 'curso',
    fields: [
      ['title', 'Titulo', 'text'],
      ['title_fr', 'Titulo FR', 'text'],
      ['title_es', 'Titulo ES', 'text'],
      ['title_en', 'Titulo EN', 'text'],
      ['slug', 'Slug', 'text'],
      ['level', 'Nivel', 'level-select'],
      ['teacher_id', 'Profesor', 'teacher-select'],
      ['weekday', 'Dia', 'weekday-select'],
      ['starts_at', 'Horario', 'time-slot-select'],
      ['room', 'Sala', 'select'],
      ['capacity', 'Capacidad', 'number'],
      ['sort_order', 'Orden', 'number'],
      ['is_new', 'Nuevo', 'boolean'],
      ['is_active', 'Activo', 'boolean']
    ],
    empty: {
      title: '',
      title_fr: '',
      title_es: '',
      title_en: '',
      slug: '',
      dance_style: '',
      level: 'beginners',
      teacher_id: '',
      weekday: 1,
      starts_at: '18:30',
      ends_at: '19:30',
      room: 'Salle 1',
      capacity: 30,
      sort_order: 0,
      is_new: false,
      is_active: true
    }
  },
  news: {
    label: 'Noticias',
    singular: 'noticia',
    fields: [
      ['title', 'Titulo', 'text'],
      ['slug', 'Slug', 'text'],
      ['excerpt', 'Resumen', 'textarea'],
      ['content', 'Contenido', 'textarea'],
      ['cover_image_url', 'Imagen principal', 'image'],
      ['document_url', 'Documento PDF', 'file'],
      ['document_links', 'Documentos para descargar', 'link-list'],
      ['gallery_image_urls', 'Imagenes para compartir', 'image-list'],
      ['support_links', 'Vinculos para compartir', 'link-list'],
      ['category', 'Categoria', 'select'],
      ['status', 'Estado', 'select'],
      ['published_at', 'Publicado', 'datetime-local']
    ],
    empty: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image_url: '',
      document_url: '',
      document_links: [],
      gallery_image_urls: [],
      support_links: [],
      category: 'news',
      status: 'draft',
      published_at: ''
    }
  },
  'pricing-plans': {
    label: 'Formules',
    singular: 'formule',
    fields: [
      ['title', 'Titre', 'text'],
      ['slug', 'Slug', 'text'],
      ['normal_price', 'Prix normal', 'text'],
      ['reduced_price', 'Prix reduit', 'text'],
      ['description', 'Description', 'textarea'],
      ['sort_order', 'Ordre', 'number'],
      ['is_active', 'Actif', 'boolean']
    ],
    empty: {
      title: '',
      slug: '',
      normal_price: '',
      reduced_price: '',
      sort_order: 0,
      is_active: true
    }
  },
  pages: {
    label: 'Paginas',
    singular: 'pagina',
    fields: [
      ['title', 'Titulo', 'text'],
      ['slug', 'Slug', 'text'],
      ['excerpt', 'Resumen', 'textarea'],
      ['content', 'Contenido', 'textarea'],
      ['hero_image_url', 'Imagen principal', 'image'],
      ['document_url', 'Documento PDF', 'file'],
      ['document_links', 'Documentos para descargar', 'link-list'],
      ['gallery_image_urls', 'Imagenes para compartir', 'image-list'],
      ['support_links', 'Vinculos para compartir', 'link-list'],
      ['status', 'Estado', 'select'],
      ['show_in_nav', 'Mostrar en menu', 'boolean'],
      ['sort_order', 'Orden', 'number'],
      ['seo_title', 'SEO titulo', 'text'],
      ['seo_description', 'SEO descripcion', 'textarea'],
      ['published_at', 'Publicado', 'datetime-local']
    ],
    empty: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      hero_image_url: '',
      document_url: '',
      document_links: [],
      gallery_image_urls: [],
      support_links: [],
      status: 'draft',
      show_in_nav: false,
      sort_order: 0,
      seo_title: '',
      seo_description: '',
      published_at: ''
    }
  },
  settings: {
    label: 'Parametros',
    singular: 'parametro',
    fields: [
      ['group_name', 'Grupo', 'text'],
      ['label', 'Etiqueta', 'text'],
      ['setting_key', 'Clave tecnica', 'text'],
      ['field_type', 'Tipo de campo', 'setting-type-select'],
      ['value', 'Valor', 'setting-value'],
      ['sort_order', 'Orden', 'number'],
      ['is_public', 'Publico', 'boolean']
    ],
    empty: {
      group_name: 'brand',
      label: '',
      setting_key: '',
      field_type: 'text',
      value: '',
      sort_order: 0,
      is_public: true
    }
  }
};

export const selectOptions = {
  category: ['event', 'news', 'workshop', 'announcement'],
  level: ['all_levels', 'beginners', 'intermediate', 'intermediate_advanced', 'advanced'],
  levels: ['all_levels', 'beginners', 'intermediate', 'intermediate_advanced', 'advanced'],
  room: ['Salle 1', 'Salle 2'],
  field_type: ['text', 'textarea', 'url', 'image', 'file', 'number'],
  status: ['draft', 'published'],
  time_slot: [
    ['18:30', '19:30'],
    ['19:30', '20:30'],
    ['20:30', '21:30'],
    ['21:30', '22:30']
  ],
  weekday: [
    ['1', 'Lundi'],
    ['2', 'Mardi'],
    ['3', 'Mercredi'],
    ['4', 'Jeudi'],
  ]
};










