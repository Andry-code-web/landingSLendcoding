/* ============================================================
   DEMOS.JS – Lógica de la página de demos
   ============================================================
   Flujo:
   1. Lee ?service=ID de la URL
   2. Carga data/demos.json
   3. Rellena el hero y genera las tarjetas de demo
   4. Genera los tabs de servicio para navegar entre servicios
   ============================================================ */

(function () {
    'use strict';

    // ---- Configuración de colores por servicio ----
    const SERVICE_COLORS = {
        landing:  '#0ea5e9',
        crm:      '#8b5cf6',
        web:      '#10b981',
        asesoria: '#f59e0b',
    };

    // ---- Íconos por servicio (Phosphor) ----
    const SERVICE_ICONS = {
        landing:  'ph-browsers',
        crm:      'ph-kanban',
        web:      'ph-globe',
        asesoria: 'ph-chalkboard-teacher',
    };

    // ---- Obtener el ID de servicio de la URL ----
    function getServiceId() {
        const params = new URLSearchParams(window.location.search);
        return (params.get('service') || '').toLowerCase().trim();
    }

    // ---- Cargar el JSON ----
    async function loadDemosData() {
        const response = await fetch('./data/demos.json');
        if (!response.ok) throw new Error('No se pudo cargar el JSON');
        return response.json();
    }

    // ---- Renderizar el Hero ----
    function renderHero(service) {
        const color = SERVICE_COLORS[service.id] || '#0ea5e9';

        // Breadcrumb
        const bc = document.getElementById('breadcrumb-service');
        if (bc) bc.textContent = service.name;

        // Badge
        const heroTag = document.getElementById('hero-tag');
        if (heroTag) heroTag.textContent = service.tag;

        // Icon
        const heroIconEl = document.getElementById('hero-icon-i');
        if (heroIconEl) {
            heroIconEl.className = `ph ${service.icon || SERVICE_ICONS[service.id]}`;
        }
        const heroIconWrap = document.getElementById('hero-icon');
        if (heroIconWrap) {
            heroIconWrap.style.background = `${color}22`;
            heroIconWrap.style.borderColor = `${color}44`;
            heroIconWrap.style.color = color;
        }

        // Title & desc
        const heroTitle = document.getElementById('hero-title');
        if (heroTitle) heroTitle.textContent = service.name;

        const heroDesc = document.getElementById('hero-desc');
        if (heroDesc) heroDesc.textContent = service.description;

        // Page title
        document.title = `${service.name} – Demos | SL Strategic Systems`;
    }

    // ---- Renderizar tabs de servicios ----
    function renderTabs(allData, activeId) {
        const container = document.getElementById('service-tabs');
        if (!container) return;

        container.innerHTML = '';
        const serviceOrder = ['landing', 'crm', 'web', 'asesoria'];

        serviceOrder.forEach(key => {
            const svc = allData[key];
            if (!svc) return;

            const btn = document.createElement('button');
            btn.className = 'service-tab-btn' + (key === activeId ? ' active' : '');
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', key === activeId ? 'true' : 'false');
            btn.setAttribute('data-service', key);
            btn.innerHTML = `<i class="ph ${SERVICE_ICONS[key]}"></i> ${svc.name}`;

            btn.addEventListener('click', () => {
                // Cambiar URL sin recargar la página
                const url = new URL(window.location);
                url.searchParams.set('service', key);
                window.history.pushState({}, '', url);

                // Re-renderizar todo
                renderAll(allData, key);
            });

            container.appendChild(btn);
        });
    }

    // ---- Crear una tarjeta de demo ----
    function createDemoCard(demo, color, delay) {
        const isCaseReal = demo.badge === 'Caso real';
        const badgeClass = isCaseReal ? 'badge-real' : 'badge-demo';
        const badgeIcon = isCaseReal ? 'ph-check-circle' : 'ph-eye';

        // Stats HTML
        const statsHTML = (demo.stats || []).map(s => `
            <div class="demo-stat">
                <span class="demo-stat-value">${s.value}</span>
                <span class="demo-stat-label">${s.label}</span>
            </div>
        `).join('');

        // Features HTML
        const featuresHTML = (demo.features || []).map(f => `
            <li><i class="ph ph-check-circle"></i>${f}</li>
        `).join('');

        // Tags HTML
        const tagsHTML = (demo.tags || []).map(t => `
            <span class="demo-tag">${t}</span>
        `).join('');

        const hasDemoUrl = demo.demoUrl && demo.demoUrl.trim() !== '';

        const eyeBtnHTML = hasDemoUrl
            ? `<a href="${demo.demoUrl}" target="_blank" rel="noopener"
                  class="demo-eye-btn demo-eye-btn--active"
                  title="Ver demo en vivo"
                  id="eye-${demo.id}">
                   <i class="ph ph-eye"></i>
               </a>`
            : `<button class="demo-eye-btn demo-eye-btn--disabled"
                       title="Demo próximamente disponible"
                       disabled
                       id="eye-${demo.id}">
                   <i class="ph ph-eye-slash"></i>
               </button>`;

        const card = document.createElement('article');
        card.className = 'demo-card demo-card-enter';
        card.style.animationDelay = `${delay * 0.12}s`;
        card.style.setProperty('--accent-color', color);
        card.id = `demo-${demo.id}`;

        card.innerHTML = `
            <div class="demo-card-accent" style="background: ${color};"></div>
            <div class="demo-card-body">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                    <span class="demo-card-badge ${badgeClass}">
                        <i class="ph ${badgeIcon}"></i> ${demo.badge}
                    </span>
                    <div class="demo-card-tags">${tagsHTML}</div>
                </div>
                <h2 class="demo-card-title">${demo.title}</h2>
                <p class="demo-card-desc">${demo.description}</p>
                ${statsHTML ? `<div class="demo-stats-row">${statsHTML}</div>` : ''}
                ${featuresHTML ? `<ul class="demo-features">${featuresHTML}</ul>` : ''}
            </div>
            <div class="demo-card-footer">
                <a href="./index.html#contacto?ref=${demo.id}" class="demo-card-cta">
                    Quiero algo así <i class="ph ph-arrow-right"></i>
                </a>
                ${eyeBtnHTML}
            </div>
        `;

        return card;
    }

    // ---- Renderizar las tarjetas de demos ----
    function renderDemoCards(service) {
        const grid = document.getElementById('demos-grid');
        if (!grid) return;

        grid.innerHTML = '';
        const color = SERVICE_COLORS[service.id] || '#0ea5e9';

        (service.demos || []).forEach((demo, i) => {
            const card = createDemoCard(demo, color, i);
            grid.appendChild(card);
        });
    }

    // ---- Mostrar / ocultar estados ----
    function showState(state) {
        const loading = document.getElementById('demos-loading');
        const error   = document.getElementById('demos-error');
        const grid    = document.getElementById('demos-grid');

        loading?.classList.add('hidden');
        error?.classList.add('hidden');
        grid?.classList.add('hidden');

        if (state === 'loading') loading?.classList.remove('hidden');
        if (state === 'error')   error?.classList.remove('hidden');
        if (state === 'grid')    grid?.classList.remove('hidden');
    }

    // ---- Render completo ----
    function renderAll(allData, serviceId) {
        // Actualizar tabs activos
        document.querySelectorAll('.service-tab-btn').forEach(btn => {
            const isActive = btn.dataset.service === serviceId;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        const service = allData[serviceId];
        if (!service) {
            showState('error');
            return;
        }

        renderHero(service);
        renderDemoCards(service);
        showState('grid');

        // Scroll al top suavemente si ya estabas en la página
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ---- Manejar botón atrás / adelante del browser ----
    window.addEventListener('popstate', async () => {
        const allData = window._demosData;
        if (!allData) return;
        renderAll(allData, getServiceId() || Object.keys(allData)[0]);
    });

    // ---- Punto de entrada ----
    async function init() {
        showState('loading');

        try {
            const allData = await loadDemosData();
            window._demosData = allData; // guardar referencia para popstate

            let serviceId = getServiceId();

            // Si no hay service en URL o no existe, usar el primero disponible
            if (!serviceId || !allData[serviceId]) {
                serviceId = Object.keys(allData)[0] || 'landing';
                // Actualizar URL silenciosamente
                const url = new URL(window.location);
                url.searchParams.set('service', serviceId);
                window.history.replaceState({}, '', url);
            }

            renderTabs(allData, serviceId);
            renderAll(allData, serviceId);

        } catch (err) {
            console.error('Error cargando demos:', err);
            showState('error');
        }
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
