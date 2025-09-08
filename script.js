// Clean, defensive UI initializer for index.html
// Provides: tabs, collapsibles, domain filter, notification helper, BOM preview loader from demo-data.json

(function () {
  'use strict';

  // Clean up duplicate elements
  function cleanupDuplicateElements() {
    console.log('Cleaning up duplicate elements...');

    // Remove duplicate menu sections
    const menuSections = document.querySelectorAll('.menu-section');
    const seenSections = new Set();

    menuSections.forEach((section, index) => {
      const sectionType = section.querySelector('.menu-parent')?.dataset?.section;
      if (sectionType && seenSections.has(sectionType)) {
        console.log(`Removing duplicate ${sectionType} section at index ${index}`);
        section.remove();
      } else if (sectionType) {
        seenSections.add(sectionType);
      }
    });

    // Remove duplicate sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar-link:not(.child-link)');
    const seenLinks = new Set();

    sidebarLinks.forEach((link, index) => {
      const linkText = link.textContent.trim();
      if (seenLinks.has(linkText)) {
        console.log(`Removing duplicate sidebar link: ${linkText} at index ${index}`);
        link.remove();
      } else {
        seenLinks.add(linkText);
      }
    });

    console.log('Cleanup complete');
  }

  // Safe DOM-ready helper
  function ready(fn) {
    if (document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }

  // Small notification helper
  function notify(message, type = 'info', timeout = 3000) {
    const n = document.createElement('div');
    n.className = `tmf-notification tmf-${type}`;
    n.textContent = message;
    Object.assign(n.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#111827',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: '8px',
      zIndex: 99999,
    });
    document.body.appendChild(n);
    setTimeout(() => (n.style.opacity = '0'), timeout - 250);
    setTimeout(() => n.remove(), timeout);
  }

  // Hierarchical Menu
  function initHierarchicalMenu() {
    console.log('Initializing hierarchical menu...');

    // Clean up any duplicate elements that might exist
    cleanupDuplicateElements();

    // Use event delegation on the sidebar menu container
    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (!sidebarMenu) {
      console.error('Sidebar menu container not found!');
      return;
    }

    // Check if we've already initialized this menu
    if (sidebarMenu.dataset.hierarchicalInitialized) {
      console.log('Hierarchical menu already initialized, skipping...');
      return;
    }

    // Mark as initialized
    sidebarMenu.dataset.hierarchicalInitialized = 'true';

    // Add event delegation for parent menu items
    sidebarMenu.addEventListener('click', function (e) {
      const target = e.target.closest('.menu-parent');
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Parent clicked:', target.dataset.section);
        const section = target.dataset.section;
        const children = document.getElementById(`${section}-children`);

        if (children) {
          // Toggle expanded state
          const wasExpanded = target.classList.contains('expanded');
          target.classList.toggle('expanded');
          children.classList.toggle('expanded');

          // Force display update for CSS
          if (target.classList.contains('expanded')) {
            children.style.display = 'block';
            // Ensure the expanded section is visible in the scroll area
            setTimeout(() => {
              children.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
          } else {
            children.style.display = 'none';
          }

          console.log(
            'Toggled expanded state for:',
            section,
            'Was expanded:',
            wasExpanded,
            'Now expanded:',
            target.classList.contains('expanded'),
          );
        } else {
          console.error('Children not found for section:', section);
        }
      }

      // Handle child link clicks
      const childTarget = e.target.closest('.child-link');
      if (childTarget) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Child link clicked:', childTarget.textContent.trim());

        // Remove active class from all child links
        document.querySelectorAll('.child-link').forEach((l) => l.classList.remove('active'));
        // Add active class to clicked link
        childTarget.classList.add('active');

        // Handle tab switching if data-tab is present
        const tabId = childTarget.dataset.tab;
        if (tabId) {
          const tabButton = document.querySelector(
            `.top-tabs-section .tab-btn[data-tab="${tabId}"]`,
          );
          if (tabButton) {
            tabButton.click();
          }
        }
      }
    });

    console.log('Hierarchical menu initialization complete with event delegation');
  }

  // Tabs
  function initTabs() {
    const buttons = Array.from(document.querySelectorAll('.top-tabs-section .tab-btn'));
    const panes = Array.from(document.querySelectorAll('.tab-content-area .tab-content'));
    if (!buttons.length || !panes.length) return;

    function activate(id) {
      buttons.forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
      panes.forEach((p) => {
        const active = p.id === id;
        p.classList.toggle('active', active);
        p.style.display = active ? 'block' : 'none';
      });
    }

    buttons.forEach((b) => b.addEventListener('click', () => activate(b.dataset.tab)));
    // activate first button (defensive)
    const firstId = buttons[0]?.dataset?.tab || panes[0]?.id;
    if (firstId) activate(firstId);
  }

  // Collapsibles (attach toggles to elements with .section-collapsible)
  function initCollapsibles() {
    document.querySelectorAll('.section-collapsible').forEach((section) => {
      if (section.dataset._collapsibleInit) return;
      section.dataset._collapsibleInit = '1';
      const header =
        section.querySelector('.panel-header') || section.querySelector('.capability-header');
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'collapse-toggle in-header';
      toggle.innerHTML = '<i class="fas fa-chevron-down" aria-hidden="true"></i>';
      if (header) header.appendChild(toggle);
      else section.insertAdjacentElement('afterbegin', toggle);
      toggle.addEventListener('click', () => section.classList.toggle('collapsed'));
    });
  }

  // Domain filter wiring (select with id domainFilter)
  function initDomainFilter() {
    const sel = document.getElementById('domainFilter');
    if (!sel) return;
    sel.addEventListener('change', () => {
      const val = sel.value;
      document.querySelectorAll('.domain-group').forEach((g) => {
        g.style.display = val === 'all' || g.dataset.domain === val ? '' : 'none';
      });
    });
  }

  // BOM preview loader
  async function loadBOMPreview() {
    const container = document.getElementById('bomPreview');
    if (!container) return;
    container.innerHTML = '<div class="muted">Loading demo BOM...</div>';
    try {
      const resp = await fetch('demo-data.json', { cache: 'no-store' });
      if (!resp.ok) throw new Error('Failed to load demo-data.json');
      const data = await resp.json();
      renderBOMPreview(container, data);
    } catch (err) {
      container.innerHTML =
        '<div class="muted">Unable to load demo-data.json (check file exists)</div>';
      console.error(err);
    }
  }

  function renderBOMPreview(container, data) {
    const product = data?.product || { name: 'Demo Project' };
    const services = data?.services || [];
    const resources = data?.resources || [];
    const html = [];
    html.push(
      `<div class="bom-card"><h4>Product: ${escapeHtml(product.name)}</h4><p class="muted">${escapeHtml(product.description || '')}</p></div>`,
    );

    html.push('<div class="bom-section"><h5>Services</h5>');
    if (services.length === 0) html.push('<div class="muted">No services in demo data</div>');
    else {
      html.push('<ul>');
      services.forEach((s) =>
        html.push(
          `<li><strong>${escapeHtml(s.name)}</strong> — ${escapeHtml(s.phase || '')} — ${escapeHtml(String(s.effort || ''))} PD — ${escapeHtml(String(s.cost || ''))}</li>`,
        ),
      );
      html.push('</ul>');
    }
    html.push('</div>');

    html.push('<div class="bom-section"><h5>Resources</h5>');
    if (resources.length === 0) html.push('<div class="muted">No resources in demo data</div>');
    else {
      html.push('<ul>');
      resources.forEach((r) =>
        html.push(
          `<li><strong>${escapeHtml(r.name)}</strong> — ${escapeHtml(r.type || '')} — ${escapeHtml(String(r.rate || ''))}</li>`,
        ),
      );
      html.push('</ul>');
    }
    html.push('</div>');

    container.innerHTML = html.join('');
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Wire basic buttons (non-critical stubs)
  function initButtons() {
    document.getElementById('generateBOM')?.addEventListener('click', () => {
      loadBOMPreview();
      notify('BOM preview generated', 'success');
    });
    document.getElementById('exportBOM')?.addEventListener('click', () => {
      notify('Export not configured in demo', 'info');
    });
    document.getElementById('downloadBOM')?.addEventListener('click', () => {
      notify('Download started (demo)', 'info');
    });
  }

  // Update domain counts (checkbox selection badges)
  function updateDomainCounts() {
    document.querySelectorAll('.domain-group').forEach((group) => {
      const count = group.querySelectorAll(
        '.domain-capabilities input[type=checkbox]:checked',
      ).length;
      const ce = group.querySelector('.domain-count');
      if (ce) ce.textContent = `${count} selected`;
      if (ce) ce.style.background = count > 0 ? '#10b981' : '#dbeafe';
    });
  }

  // Initialize everything
  ready(() => {
    try {
      // Use the robust workflow tabs initializer which also ensures
      // required tab panes are present inside the main panel.
      initializeWorkflowTabs();
      renderCurrentWorkflowStatus();
      // Record header height to position fixed sidebar correctly
      const header = document.querySelector('.app-header');
      const h = header ? header.getBoundingClientRect().height : 64;
      const root = document.documentElement;
      root.style.setProperty('--header-height', `${Math.round(h)}px`);
      initCollapsibles();
      initDomainFilter();
      initButtons();
      loadBOMPreview().catch(() => {});
      updateDomainCounts();
      window.tmf = { notify, loadBOMPreview };
      // Initialize SpecSync integration after DOM ready
      // Delay SpecSync init until after tabs have cloned content into panel
      setTimeout(initializeSpecSyncIntegration, 600);
      // Initialize hierarchical menu after everything else is ready
      setTimeout(initHierarchicalMenu, 100);
    } catch (err) {
      console.error('Initialization error', err);
      notify('UI initialization failure — check console', 'error');
    }
  });
})();

// Render dummy lifecycle data in Current Workflow Status
function renderCurrentWorkflowStatus() {
  const target = document.getElementById('workflow-status');
  if (!target) return;

  const phases = [
    { label: 'Presales', percent: 100 },
    { label: 'Delivery', percent: 10 },
    { label: 'Post-Production', percent: 0 },
    { label: 'Managed Services', percent: 0 },
  ];

  const html = [];
  html.push('<h3><i class="fas fa-route"></i> Current Workflow Status</h3>');
  html.push('<p class="muted">Summary and quick actions are available in the panels below.</p>');
  html.push('<div class="workflow-details">');

  html.push('<div class="workflow-metrics">');
  html.push('<div class="metric-item">');
  html.push('<span class="metric-label">Phase Progress</span>');
  html.push('<div class="phase-progress">');
  phases.forEach((p) => {
    const cls = p.percent >= 100 ? 'completed' : p.percent > 0 ? 'in-progress' : 'pending';
    html.push('<div class="progress-item">');
    html.push(`<span>${p.label}</span>`);
    html.push('<div class="progress-bar small">');
    html.push(`<div class="progress-fill ${cls}" style="width:${p.percent}%"></div>`);
    html.push('</div>');
    html.push(`<span>${p.percent}%</span>`);
    html.push('</div>');
  });
  html.push('</div></div>');

  html.push('<div class="metric-item">');
  html.push('<span class="metric-label">Key Milestones</span>');
  html.push('<div class="milestone-list">');
  html.push(
    '<div class="milestone completed"><i class="fas fa-check-circle"></i><span>Presales Complete</span><span class="milestone-date">Dec 2024</span></div>',
  );
  html.push(
    '<div class="milestone in-progress"><i class="fas fa-clock"></i><span>Delivery Definition</span><span class="milestone-date">Jan 2025</span></div>',
  );
  html.push(
    '<div class="milestone pending"><i class="fas fa-hourglass-start"></i><span>Build Complete</span><span class="milestone-date">Q2 2025</span></div>',
  );
  html.push(
    '<div class="milestone pending"><i class="fas fa-hourglass-start"></i><span>Production Cutover</span><span class="milestone-date">Q3 2025</span></div>',
  );
  html.push('</div></div>');
  html.push('</div>');

  html.push('<div class="workflow-actions-panel">');
  html.push('<h4>Quick Actions</h4>');
  html.push('<div class="action-buttons">');
  html.push('<button class="btn-small"><i class="fas fa-plus"></i> Add Milestone</button>');
  html.push('<button class="btn-small"><i class="fas fa-edit"></i> Update Progress</button>');
  html.push('<button class="btn-small"><i class="fas fa-flag"></i> Flag Issue</button>');
  html.push('<button class="btn-small"><i class="fas fa-calendar"></i> Schedule Review</button>');
  html.push('</div></div>');
  html.push('</div>');

  target.innerHTML = html.join('');
}

// Sidebar navigation wiring
(function () {
  function initSidebar() {
    // Check if already initialized
    if (document.body.dataset.sidebarInitialized) {
      return;
    }

    // Exclude child links from hierarchical menu to avoid conflicts
    const links = Array.from(document.querySelectorAll('.sidebar-link:not(.child-link)'));
    if (!links.length) return;
    const tabButtons = Array.from(document.querySelectorAll('.top-tabs-section .tab-btn'));

    function activateTab(id) {
      const btn = tabButtons.find((b) => b.dataset.tab === id);
      if (btn) btn.click();
      // also scroll to tab panel
      document
        .querySelector('.tab-content-area')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function scrollToSection(id) {
      const target = document.getElementById(id) || document.querySelector('.' + id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    links.forEach((link) => {
      link.addEventListener('click', () => {
        links.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');
        const tab = link.getAttribute('data-tab');
        const scroll = link.getAttribute('data-scroll');
        if (tab) activateTab(tab);
        if (scroll) scrollToSection(scroll);
      });
    });

    // Mark as initialized
    document.body.dataset.sidebarInitialized = 'true';
  }
  // defer until DOM paint
  requestAnimationFrame(initSidebar);
})();

function resolveCapabilityIdFromText(text) {
  const s = String(text || '');
  // Heuristic mapping to existing Scoping capability IDs in index.html
  if (/api\s*management|api\b|graphql|soap|rest/i.test(s)) return 'api-mgmt';
  if (/workflow|bpm|orchestr/i.test(s)) return 'bpm-workflow';
  if (/partner|interconnect/i.test(s)) return 'partner-relationship-mgmt';
  // Only map to wholesale billing when clearly wholesale/interconnect-related
  if (/wholesale|interconnect/i.test(s)) return 'wholesale-billing';
  if (/revenue\s*assurance|leakage/i.test(s)) return 'revenue-assurance-mgmt';
  if (/fraud/i.test(s)) return 'fraud-mgmt';
  if (/compliance|regulatory|gdpr|sox/i.test(s)) return 'compliance-mgmt';
  if (/fault|alarm/i.test(s)) return 'fault-mgmt';
  if (/usage/i.test(s)) return 'usage-mgmt';
  if (/resource\s*lifecycle|resource\b/i.test(s)) return 'resource-lifecycle-mgmt';
  return null;
}

function mapSpecSyncToCapabilities(items) {
  const countsByCapability = {};
  const assignments = [];
  let unmapped = 0;
  const seenLocal = new Set();
  items.forEach((item) => {
    const capName = (item.capability || '').toString();
    const func = (item.functionName || '').toString();
    const vert = (item.vertical || '').toString();
    const candidates = [capName, func, vert].filter(Boolean);
    let capId = null;
    for (const c of candidates) {
      capId = resolveCapabilityIdFromText(c);
      if (capId) break;
    }
    // Domain-guided fallback (very light-touch)
    if (!capId) {
      const domain = (item.domain || '').toString();
      if (/integration/i.test(domain))
        capId = /workflow|orchestr/i.test(func)
          ? 'bpm-workflow'
          : /api|rest|soap|graphql/i.test(func)
            ? 'api-mgmt'
            : null;
      if (/resource/i.test(domain) && /lifecycle|resource/i.test(func))
        capId = capId || 'resource-lifecycle-mgmt';
    }
    if (capId) {
      const rid = String(item.rephrasedRequirementId || item.sourceRequirementId || Math.random());
      const key = `${capId}||${rid}`;
      if (!seenLocal.has(key)) {
        seenLocal.add(key);
        countsByCapability[capId] = (countsByCapability[capId] || 0) + 1;
        assignments.push({ requirementId: rid, capabilityId: capId });
      }
    } else {
      unmapped++;
    }
  });
  return { countsByCapability, assignments, unmapped };
}

// Build counts keyed by imported domain/capability strings, then map to element IDs
function mapSpecSyncByImportedCapabilities(items) {
  const countsByCapability = {};
  const assignments = [];
  let unmapped = 0;
  const seenLocal = new Set();

  // Build an ID map on the fly from current DOM labels:
  const labelToId = new Map();
  document.querySelectorAll('.capability-item').forEach((ci) => {
    const input = ci.querySelector('input[type="checkbox"]');
    const label = ci.querySelector('label');
    if (!input || !label) return;
    const id = input.id || input.getAttribute('id') || label.getAttribute('for');
    const name = (label.textContent || '').trim().toLowerCase();
    if (id && name) {
      labelToId.set(name, id);
    }
  });

  const normalize = (s) =>
    String(s || '')
      .trim()
      .toLowerCase();
  const generateCapabilityIdFromName = (name) =>
    `imported-${normalize(name)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}`;

  items.forEach((item) => {
    const capName = normalize(item.capability); // now equal to AF L2
    const af2Name = normalize(item.afLevel2);
    const funcName = normalize(item.functionName);
    const domain = normalize(item.domain);

    let capId = null;
    // Prefer exact label matches first
    if (capName && labelToId.has(capName)) capId = labelToId.get(capName);
    // Fallback to AF Level 2 or function name matching label text
    if (!capId && af2Name && labelToId.has(af2Name)) capId = labelToId.get(af2Name);
    if (!capId && funcName && labelToId.has(funcName)) capId = labelToId.get(funcName);

    // No heuristics: we only trust AF L2/capability text now

    // If still not found, create a dynamic id from AF L2 or capability text so it can be rendered and counted
    if (!capId) {
      const basis = af2Name || capName || 'capability';
      capId = generateCapabilityIdFromName(basis);
      unmapped++;
    }

    if (capId) {
      const rid = String(item.rephrasedRequirementId || item.sourceRequirementId || Math.random());
      const key = `${capId}||${rid}`;
      if (!seenLocal.has(key)) {
        seenLocal.add(key);
        countsByCapability[capId] = (countsByCapability[capId] || 0) + 1;
        assignments.push({ requirementId: rid, capabilityId: capId });
      }
    }
  });

  return { countsByCapability, assignments, unmapped };
}

// Render dynamic domain groups from imported data so they can be filtered and selected
function renderDynamicScopingFromImport(items) {
  const container = document.getElementById('capabilities');
  if (!container) return;
  // Remove old dynamic groups
  container.querySelectorAll('.domain-group.dynamic-imported-group').forEach((el) => el.remove());

  const normalize = (s) => String(s || '').trim();
  const slugify = (s) =>
    normalize(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  const genCapId = (name) => `imported-${slugify(name)}`;

  // Group by domain
  const byDomain = new Map();
  const rowKeys = new Set();
  items.forEach((it) => {
    const d = normalize(it.domain) || 'Imported';
    const cap = normalize(it.afLevel2 || it.capability || 'Capability');
    const rid = String(it.rephrasedRequirementId || it.sourceRequirementId || Math.random());
    const key = `${d}||${cap}||${rid}`;
    if (rowKeys.has(key)) return; // avoid duplicate row counting
    rowKeys.add(key);
    if (!byDomain.has(d)) byDomain.set(d, new Map());
    const caps = byDomain.get(d);
    // attach tag set per capability
    const entry = caps.get(cap) || { count: 0, tags: new Set() };
    entry.count += 1;
    (it.tags || []).forEach((t) => entry.tags.add(t));
    caps.set(cap, entry);
  });

  const firstAnchor = container.querySelector('.domain-group');
  for (const [domain, caps] of byDomain) {
    const group = document.createElement('div');
    group.className = 'domain-group dynamic-imported-group';
    group.setAttribute('data-domain', slugify(domain));
    group.style.border = '1px dashed #93c5fd';
    group.style.marginBottom = '12px';

    const header = document.createElement('div');
    header.className = 'domain-header';
    header.innerHTML = `<i class="fas fa-cloud-upload-alt"></i><h4>${domain}</h4><span class="domain-count">0 selected</span><i class="fas fa-chevron-down expand-icon"></i>`;
    const capsWrap = document.createElement('div');
    capsWrap.className = 'domain-capabilities';

    for (const [capName, agg] of caps) {
      const id = genCapId(capName);
      const item = document.createElement('div');
      item.className = 'capability-item';
      item.innerHTML = `<input type="checkbox" id="${id}" checked><label for="${id}">${capName}</label>`;
      // Attach unique tags for this capability to the right side like other domains
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'segment-tags';
      Array.from(agg.tags || []).forEach((t) => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag segment-tag';
        tagEl.textContent = t;
        tagsWrap.appendChild(tagEl);
      });
      if (tagsWrap.childNodes.length) item.appendChild(tagsWrap);
      capsWrap.appendChild(item);
    }
    group.appendChild(header);
    group.appendChild(capsWrap);
    container.insertBefore(group, firstAnchor);
  }
}

// Update domain filter options from a provided set of domains
function updateDomainFilterOptionsFromSet(domains) {
  const sel = document.getElementById('domainFilter');
  if (!sel) return;
  const slugify = (s) =>
    String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  // Merge baseline TMF domain list (captured at init) with provided domains
  const merged = new Set([...(window.__baseDomainOptions || []), ...Array.from(domains)]);
  // Reset, keep All Domains
  sel.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'All Domains';
  sel.appendChild(optAll);
  Array.from(merged)
    .filter(Boolean)
    .sort()
    .forEach((d) => {
      const val = slugify(d);
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = d;
      sel.appendChild(opt);
    });
}

// Parse TMF Domains/Capabilities from workbook sheet: "Input - TMF Categories"
function parseTMFCategoriesFromWorkbook(workbook) {
  const sheetName = (workbook.SheetNames || []).find((n) =>
    /input\s*-\s*tmf\s*categories/i.test(String(n)),
  );
  if (!sheetName) return null;
  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const domains = {};
  // Expect columns like: Domain, Capability (or Function), Description
  rows.forEach((r) => {
    const d = String(r['Domain'] || r['TMF Domain'] || '').trim();
    const c = String(r['Capability'] || r['Function'] || r['Capability Name'] || '').trim();
    if (!d || !c) return;
    if (!domains[d]) domains[d] = new Set();
    domains[d].add(c);
  });
  // Convert sets to arrays
  const out = {};
  Object.keys(domains).forEach((d) => {
    out[d] = Array.from(domains[d]);
  });
  return out;
}

// Render baseline TMF catalog (domains and capabilities) before imported items, allowing user to add custom ones
function renderTMFCatalogFromCategories(categories) {
  const container = document.getElementById('capabilities');
  if (!container) return;
  // Avoid duplicating: only add if not present
  if (container.querySelector('[data-origin="tmf-catalog"]')) return;
  const slugify = (s) =>
    String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const anchor = container.querySelector('.domain-group');
  Object.entries(categories).forEach(([domain, caps]) => {
    const group = document.createElement('div');
    group.className = 'domain-group';
    group.setAttribute('data-origin', 'tmf-catalog');
    group.setAttribute('data-domain', slugify(domain));
    const header = document.createElement('div');
    header.className = 'domain-header';
    header.innerHTML = `<i class="fas fa-layer-group"></i><h4>${domain}</h4><span class="domain-count">0 selected</span><i class="fas fa-chevron-down expand-icon"></i>`;
    const capsWrap = document.createElement('div');
    capsWrap.className = 'domain-capabilities';
    caps.slice(0, 20).forEach((capName) => {
      const id = `tmf-${slugify(capName)}`;
      const item = document.createElement('div');
      item.className = 'capability-item';
      item.innerHTML = `<input type="checkbox" id="${id}"><label for="${id}">${capName}</label>`;
      capsWrap.appendChild(item);
    });
    group.appendChild(header);
    group.appendChild(capsWrap);
    if (anchor) container.insertBefore(group, anchor);
    else container.appendChild(group);
  });
}

function applyImportedCapabilitySelections(capabilityIds) {
  capabilityIds.forEach((id) => {
    const checkbox = document.getElementById(id) || document.getElementById(`capability-${id}`);
    if (checkbox) checkbox.checked = true;
  });
  updateDomainCounts();
  updateEstimates();
}

function updateCapabilityRequirementBadges(countsByCapability) {
  // Remove existing badges
  document.querySelectorAll('.capability-item .req-badge').forEach((el) => el.remove());
  Object.entries(countsByCapability).forEach(([capId, count]) => {
    const label =
      document.querySelector(`.capability-item label[for="${capId}"]`) ||
      document.querySelector(`.capability-item label[for="capability-${capId}"]`);
    if (label) {
      const badge = document.createElement('span');
      badge.className = 'req-badge';
      badge.textContent = `${count} req`;
      label.appendChild(badge);
    }
  });
  // Sync domain selected counts
  window.updateDomainCounts && window.updateDomainCounts();
}

function renderImportedRequirementsPanel(state, mapping) {
  const scopingPanel =
    document.querySelector('.scoping-panel') || document.getElementById('capabilities');
  if (!scopingPanel) return;
  let panel = document.getElementById('importedRequirementsPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'importedRequirementsPanel';
    panel.className = 'imported-reqs-panel';
    scopingPanel.appendChild(panel);
  }
  const overlay = computeSpecSyncEffortOverlay(state);
  const roleKeys = ['ba', 'sa', 'dev', 'qa'];
  const roleSummary = roleKeys.map((r) => `${r.toUpperCase()}: ${overlay[r]}`).join(' · ');
  const total = state.counts.totalRequirements;
  const domains = Object.entries(state.counts.domains || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  const caps = Object.entries(mapping.countsByCapability || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  const list = mapping.assignments
    .slice(0, 10)
    .map(
      (a) =>
        `<li><strong>${a.requirementId || 'N/A'}</strong> → <code>${a.capabilityId}</code></li>`,
    )
    .join('');
  panel.innerHTML = `
        <div class="panel-header-lite">
            <h3><i class="fas fa-file-import"></i> Imported Requirements</h3>
            <span class="small-muted">${state.fileName} • ${new Date(state.importedAt).toLocaleString()}</span>
        </div>
        <div class="panel-summary">
            <span><strong>Total</strong>: ${total}</span>
            <span><strong>Domains</strong>: ${domains || '—'}</span>
            <span><strong>Mapped Capabilities</strong>: ${caps || '—'}</span>
        </div>
        <div class="panel-summary">
            <label class="toggle-include"><input type="checkbox" id="includeSpecSyncInEstimates" ${state.includeInEstimates ? 'checked' : ''}/> Include SpecSync in Estimates</label>
            <span><strong>SpecSync Effort</strong>: ${overlay.total} PD</span>
            <span class="roles">${roleSummary}</span>
        </div>
        <ul class="panel-list">${list}</ul>
    `;

  const includeCheckbox = panel.querySelector('#includeSpecSyncInEstimates');
  if (includeCheckbox) {
    includeCheckbox.addEventListener('change', () => {
      state.includeInEstimates = !!includeCheckbox.checked;
      saveSpecSyncData(state);
      updateEstimates();
    });
  }
}

function ensureSpecSyncStyles() {
  if (document.getElementById('specsync-style')) return;
  const style = document.createElement('style');
  style.id = 'specsync-style';
  style.textContent = `
        .capability-item label { position: relative; }
        .capability-item .req-badge {
            display: inline-block;
            margin-left: 8px;
            padding: 2px 6px;
            background: #10b981;
            color: #fff;
            border-radius: 10px;
            font-size: 11px;
        }
        .imported-reqs-panel { 
            margin-top: 16px; 
            padding: 12px; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            background: #f9fafb;
        }
        .imported-reqs-panel .panel-header-lite { display:flex; justify-content: space-between; align-items:center; margin-bottom:8px; }
        .imported-reqs-panel .panel-header-lite h3 { margin: 0; font-size: 1rem; }
        .imported-reqs-panel .small-muted { color: #6b7280; font-size: 12px; }
        .imported-reqs-panel .panel-summary { display:flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
        .imported-reqs-panel .panel-list { margin: 0; padding-left: 18px; }
        .imported-reqs-panel .panel-list li { margin: 2px 0; }
        .imported-reqs-panel .toggle-include { display:flex; align-items:center; gap: 6px; }
    `;
  document.head.appendChild(style);
}

// Public domain count updater (safe global) for Scoping UI
if (typeof window !== 'undefined' && typeof window.updateDomainCounts !== 'function') {
  window.updateDomainCounts = function updateDomainCounts() {
    try {
      document.querySelectorAll('.domain-group').forEach((group) => {
        const count = group.querySelectorAll(
          '.domain-capabilities input[type=checkbox]:checked',
        ).length;
        const ce = group.querySelector('.domain-count');
        if (ce) {
          ce.textContent = `${count} selected`;
          ce.style.background = count > 0 ? '#10b981' : '#dbeafe';
        }
      });
    } catch (e) {
      console.warn('updateDomainCounts failed', e);
    }
  };
}

// ===== SpecSync Integration (Import → Map → Render) =====
function computeSpecSyncEffortOverlay(state) {
  // Simple effort model: per requirement split across roles
  // BA:0.5, SA:0.5, DEV:1, QA:0.5 person-days
  const items = Array.isArray(state?.items) ? state.items : [];
  const count = items.length;
  const overlay = {
    ba: Math.round(count * 0.5),
    sa: Math.round(count * 0.5),
    dev: Math.round(count * 1.0),
    qa: Math.round(count * 0.5),
  };
  overlay.total = overlay.ba + overlay.sa + overlay.dev + overlay.qa;
  return overlay;
}

function saveSpecSyncData(state) {
  try {
    localStorage.setItem('specsync-data', JSON.stringify(state));
  } catch (err) {
    console.warn('Failed saving SpecSync data', err);
  }
}

function loadSpecSyncData() {
  try {
    const raw = localStorage.getItem('specsync-data');
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Failed loading SpecSync data', err);
    return null;
  }
}

function parseCSVToSpecSyncItems(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const headerMap = new Map();
  headers.forEach((h, i) => headerMap.set(norm(h), i));
  const findIndex = (nameVariants) => {
    for (const n of nameVariants) {
      const i = headerMap.get(norm(n));
      if (typeof i === 'number') return i;
    }
    return -1;
  };
  const iReqId = findIndex([
    'Rephrased Requirement ID',
    'Rephrased-Requirement-ID',
    'RephrasedRequirementId',
    'RequirementId',
  ]);
  const iSrcId = findIndex([
    'Source Requirement ID',
    'Source-Requirement-ID',
    'SourceRequirementId',
  ]);
  const iDomain = findIndex([
    'Rephrased Domain',
    'Rephrased- Domain',
    'Rephrased - Domain',
    'Domain',
  ]);
  const iVertical = findIndex([
    'Rephrased Vertical',
    'Rephrased- Vertical',
    'Rephrased - Vertical',
    'Vertical',
  ]);
  const iFunc = findIndex([
    'Rephrased Function Name',
    'Rephrased- Function Name',
    'Rephrased - Function Name',
    'Function Name',
    'Function',
  ]);
  const iAf2 = findIndex([
    'Rephrased AF Lev.2',
    'Rephrased AF Lev. 2',
    'AF Lev.2',
    'AF Level 2',
    'Architecture Framework Level 2',
  ]);
  const iCap = findIndex([
    'Reference Capability',
    'Reference- Capability',
    'Reference - Capability',
    'Capability',
    'Reference Capability Description',
  ]);
  // Tag columns (collect uniques across any that exist)
  const iTags = findIndex(['Tags', 'Tag', 'Matching Tags']);
  const iCommon = [1, 2, 3, 4, 5].map((n) => findIndex([`Common Tag ${n}`, `CommonTag${n}`]));
  const iAdditional = Array.from({ length: 10 }, (_, i) => i + 1).map((n) =>
    findIndex([`Additional Tag ${n}`, `AdditionalTag${n}`]),
  );
  const items = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = [];
    let cur = '';
    let inQ = false;
    for (let c = 0; c < lines[r].length; c++) {
      const ch = lines[r][c];
      if (ch === '"') {
        if (inQ && lines[r][c + 1] === '"') {
          cur += '"';
          c++;
        } else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        cols.push(cur);
        cur = '';
      } else cur += ch;
    }
    cols.push(cur);
    const get = (i) =>
      i >= 0
        ? String(cols[i] || '')
            .trim()
            .replace(/^"|"$/g, '')
        : '';
    const functionName = get(iFunc);
    const afLevel2 = get(iAf2);
    const referenceCapability = get(iCap);
    const tagVals = [];
    if (iTags >= 0) tagVals.push(get(iTags));
    iCommon.forEach((i) => {
      if (i >= 0) tagVals.push(get(i));
    });
    iAdditional.forEach((i) => {
      if (i >= 0) tagVals.push(get(i));
    });
    const tags = Array.from(
      new Set(
        tagVals
          .flatMap((v) => String(v || '').split(/[,;|]/))
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );
    items.push({
      rephrasedRequirementId: get(iReqId),
      sourceRequirementId: get(iSrcId),
      domain: get(iDomain),
      vertical: get(iVertical),
      functionName,
      afLevel2,
      // STRICT: Capability must come from AF Level 2 only
      capability: afLevel2,
      referenceCapability,
      tags,
    });
  }
  return items;
}

function buildSpecSyncState(items, fileName) {
  const counts = { totalRequirements: items.length, domains: {} };
  items.forEach((it) => {
    const d = (it.domain || '').trim() || 'Unspecified';
    counts.domains[d] = (counts.domains[d] || 0) + 1;
  });
  return {
    fileName: fileName || 'SpecSync Import',
    importedAt: Date.now(),
    includeInEstimates: true,
    counts,
    items,
  };
}

function initializeSpecSyncIntegration() {
  ensureSpecSyncStyles();
  const importBtn = document.getElementById('importSpecSync');
  const clearBtn = document.getElementById('clearSpecSync');
  const fileInput = document.getElementById('specSyncFile');
  const summary = document.getElementById('specSyncSummary');

  function setSummaryText(text) {
    /* no-op: suppress header summary text */ if (summary) summary.textContent = '';
  }

  // Ensure delegated fallback binding (survives DOM replacements)
  bindSpecSyncDelegatedHandlers();

  // Reset any prior UI remnants on page load (do not auto-restore saved data)
  resetSpecSyncUI(setSummaryText);
  // Default: collapse all domain groups on load for clearer overview
  collapseAllDomainGroups();

  // Capture baseline domain options as reference (TMF defaults in the page)
  const sel = document.getElementById('domainFilter');
  if (sel && !window.__baseDomainOptions) {
    window.__baseDomainOptions = Array.from(sel.options)
      .filter((o) => (o.value || '') !== 'all')
      .map((o) => o.textContent || '')
      .filter(Boolean);
  }

  // Live counter updates on any capability selection change
  if (!window.__capabilityChangeBound) {
    window.__capabilityChangeBound = true;
    document.addEventListener('change', (e) => {
      if (
        e.target &&
        e.target.matches &&
        e.target.matches('.capability-item input[type="checkbox"]')
      ) {
        window.updateDomainCounts && window.updateDomainCounts();
      }
    });
  }

  // Delegated collapsible toggles for all domain headers (static and dynamic)
  if (!window.__domainCollapseBound) {
    window.__domainCollapseBound = true;
    document.addEventListener('click', (e) => {
      const header = e.target.closest && e.target.closest('.domain-header');
      if (
        header &&
        header.parentElement &&
        header.parentElement.classList.contains('domain-group')
      ) {
        header.parentElement.classList.toggle('collapsed');
      }
    });
  }

  if (importBtn) {
    importBtn.addEventListener('click', async () => {
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (!file) {
        if (window.showNotification) showNotification('Select a SpecSync file first', 'info');
        return;
      }
      // Ensure Excel reader is present if importing xlsx
      if (/\.xlsx?$/i.test(file.name)) {
        const ok = await ensureXLSX();
        if (!ok) {
          throw new Error(
            'Excel reader not available (CDN blocked). Please import CSV/JSON instead.',
          );
        }
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          let items = [];
          if (/\.json$/i.test(file.name)) {
            const data = JSON.parse(String(reader.result || '[]'));
            items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
          } else if (/\.xlsx?$/i.test(file.name)) {
            if (typeof XLSX === 'undefined') {
              throw new Error('Excel reader not available');
            }
            const data = new Uint8Array(reader.result);
            const workbook = XLSX.read(data, { type: 'array' });
            // Prefer a sheet that looks like the rephrased atomic requirements
            const preferred =
              (workbook.SheetNames || []).find((n) => /rephrased|atomic/i.test(String(n))) ||
              workbook.SheetNames[0];
            const ws = workbook.Sheets[preferred];
            const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
            items = json.map((r) => {
              const fn = r['Rephrased Function Name'] || r['Function Name'] || r['Function'] || '';
              const af2 =
                r['Rephrased AF Lev.2'] ||
                r['Rephrased AF Lev. 2'] ||
                r['AF Lev.2'] ||
                r['AF Level 2'] ||
                r['Architecture Framework Level 2'] ||
                '';
              const rc = r['Reference Capability'] || r['Capability'] || '';
              return {
                rephrasedRequirementId:
                  r['Rephrased Requirement ID'] ||
                  r['RephrasedRequirementId'] ||
                  r['RequirementId'] ||
                  '',
                sourceRequirementId: r['Source Requirement ID'] || r['SourceRequirementId'] || '',
                domain: r['Rephrased Domain'] || r['Domain'] || '',
                vertical: r['Rephrased Vertical'] || r['Vertical'] || '',
                functionName: fn,
                afLevel2: af2,
                capability: af2, // STRICT: only AF Level 2
                referenceCapability: rc,
              };
            });

            // Also parse TMF catalog if present
            try {
              const tmfCategories = parseTMFCategoriesFromWorkbook(workbook);
              if (tmfCategories && Object.keys(tmfCategories).length) {
                renderTMFCatalogFromCategories(tmfCategories);
                const importedDomains = new Set([
                  ...items.map((it) => (it.domain || 'Imported').toString().trim() || 'Imported'),
                  ...Object.keys(tmfCategories),
                ]);
                updateDomainFilterOptionsFromSet(importedDomains);
              }
            } catch (e) {
              console.warn('TMF categories parsing failed', e);
            }
          } else {
            items = parseCSVToSpecSyncItems(String(reader.result || ''));
          }
          const state = buildSpecSyncState(items, file.name);
          // Fresh render: clear prior artifacts and rebuild from this import
          resetSpecSyncUI(setSummaryText);
          renderDynamicScopingFromImport(items);
          const dyn = mapSpecSyncByImportedCapabilities(items);
          // Refresh domain filter to include imported domains
          const importedDomains = new Set(
            items.map((it) => (it.domain || 'Imported').toString().trim() || 'Imported'),
          );
          updateDomainFilterOptionsFromSet(importedDomains);
          state.selectedCapabilityIds = Object.keys(dyn.countsByCapability);
          saveSpecSyncData(state);
          updateCapabilityRequirementBadges(dyn.countsByCapability);
          applyImportedCapabilitySelections(state.selectedCapabilityIds || []);
          expandMappedDomainGroups(dyn.countsByCapability);
          renderImportedRequirementsPanel(state, dyn);
          // Floating toast summary
          const topCaps = Object.entries(dyn.countsByCapability)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([k, v]) => `${k}(${v})`)
            .join(', ');
          const toastMsg = `SpecSync imported: ${items.length} reqs · Domains ${new Set(items.map((it) => it.domain || 'Imported')).size}${topCaps ? ` · Top: ${topCaps}` : ''}`;
          if (window.showNotification) showNotification(toastMsg, 'success');
        } catch (err) {
          console.error('SpecSync import error:', err);
          if (window.showNotification)
            showNotification(`Failed to import SpecSync: ${err.message || 'Error'}`, 'error');
        }
      };
      reader.onerror = () => {
        if (window.showNotification) showNotification('Failed to read file', 'error');
      };
      if (/\.xlsx?$/i.test(file.name)) reader.readAsArrayBuffer(file);
      else reader.readAsText(file);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      try {
        localStorage.removeItem('specsync-data');
      } catch (e) {}
      // Remove badges and panel
      document.querySelectorAll('.capability-item .req-badge').forEach((el) => el.remove());
      const panel = document.getElementById('importedRequirementsPanel');
      if (panel) panel.remove();
      setSummaryText('');
      if (window.showNotification) showNotification('Cleared SpecSync import', 'info');
      updateDomainCounts();
    });
  }

  // Intentionally do not auto-restore saved SpecSync data on page load
}

// Minimal stub to avoid runtime errors from callers
function updateEstimates() {
  // Extend later to merge SpecSync overlay with BOM-based estimates
  return;
}

async function ensureXLSX() {
  if (typeof XLSX !== 'undefined') return true;
  // Try to find an existing script tag (in case of slow CDN)
  if (document.querySelector('script[src*="xlsx"]')) {
    // give it a moment
    await new Promise((r) => setTimeout(r, 300));
    if (typeof XLSX !== 'undefined') return true;
  }
  // Helper to attempt a script src with timeout
  const trySrc = (src) =>
    new Promise((resolve) => {
      const s = document.createElement('script');
      let done = false;
      s.src = src;
      s.async = true;
      s.onload = () => {
        if (!done) {
          done = true;
          resolve(true);
        }
      };
      s.onerror = () => {
        if (!done) {
          done = true;
          resolve(false);
        }
      };
      document.head.appendChild(s);
      setTimeout(() => {
        if (!done) {
          done = true;
          resolve(typeof XLSX !== 'undefined');
        }
      }, 2000);
    });
  // Attempt local paths first (user can drop the file into project)
  const localCandidates = ['lib/xlsx.full.min.js', 'vendor/xlsx.full.min.js', 'xlsx.full.min.js'];
  for (const src of localCandidates) {
    /* eslint no-await-in-loop: off */
    /* eslint-disable-next-line */
    const ok = await trySrc(src);
    if (typeof XLSX !== 'undefined') return true;
  }
  // Attempt multiple CDNs and versions (widely mirrored, known-good)
  const cdnCandidates = [
    // jsDelivr
    'https://cdn.jsdelivr.net/npm/xlsx@0.20.2/dist/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    // unpkg
    'https://unpkg.com/xlsx@0.20.2/dist/xlsx.full.min.js',
    'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
    // cdnjs (hosts 0.18.5)
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  ];
  for (const src of cdnCandidates) {
    /* eslint no-await-in-loop: off */
    /* eslint-disable-next-line */
    const ok = await trySrc(src);
    if (typeof XLSX !== 'undefined') return true;
  }
  console.warn('All XLSX load attempts failed (local and CDNs).');
  return false;
}

// Delegated handlers to survive DOM replacements/cloning
function bindSpecSyncDelegatedHandlers() {
  if (window.__specsyncDelegatedBound) return;
  window.__specsyncDelegatedBound = true;
  document.addEventListener('click', async (e) => {
    const importBtn =
      e.target &&
      (e.target.id === 'importSpecSync'
        ? e.target
        : e.target.closest && e.target.closest('#importSpecSync'));
    const clearBtn =
      e.target &&
      (e.target.id === 'clearSpecSync'
        ? e.target
        : e.target.closest && e.target.closest('#clearSpecSync'));
    if (importBtn) {
      try {
        const fileInput = document.getElementById('specSyncFile');
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (!file) {
          if (window.showNotification) showNotification('Select a SpecSync file first', 'info');
          return;
        }
        if (/\.xlsx?$/i.test(file.name)) {
          const ok = await ensureXLSX();
          if (!ok) {
            if (window.showNotification)
              showNotification('Excel reader not available (CDN blocked). Try CSV/JSON.', 'error');
            return;
          }
        }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            let items = [];
            if (/\.json$/i.test(file.name)) {
              const data = JSON.parse(String(reader.result || '[]'));
              items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
            } else if (/\.xlsx?$/i.test(file.name)) {
              const data = new Uint8Array(reader.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const preferred =
                (workbook.SheetNames || []).find((n) => /rephrased|atomic/i.test(String(n))) ||
                workbook.SheetNames[0];
              const ws = workbook.Sheets[preferred];
              const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
              // Determine data row numbers to read tags from column AI
              const rng = XLSX.utils.decode_range(ws['!ref'] || 'A1');
              const headerRow = rng.s.r; // zero-based
              items = json.map((r, idx) => {
                const rowNum = headerRow + 2 + idx; // Excel rows are 1-based; first data row is header+1
                // Collect tag values with priority: Common Tag 1 -> other tag columns -> fallback AI cell
                const tagCandidates = [];
                const common1 = r['Common Tag 1'] || r['CommonTag1'];
                if (common1) tagCandidates.push(String(common1));
                for (let i = 2; i <= 5; i++) {
                  const v = r[`Common Tag ${i}`] || r[`CommonTag${i}`];
                  if (v) tagCandidates.push(String(v));
                }
                for (let i = 1; i <= 10; i++) {
                  const v = r[`Additional Tag ${i}`] || r[`AdditionalTag${i}`];
                  if (v) tagCandidates.push(String(v));
                }
                if (r['Tags']) tagCandidates.push(String(r['Tags']));
                if (r['Matching Tags']) tagCandidates.push(String(r['Matching Tags']));
                if (tagCandidates.length === 0) {
                  const aiCell = ws['AI' + rowNum];
                  const rawTags = aiCell && aiCell.v ? String(aiCell.v) : '';
                  if (rawTags) tagCandidates.push(rawTags);
                }
                const tags = Array.from(
                  new Set(
                    tagCandidates
                      .flatMap((v) => String(v || '').split(/[,;|]/))
                      .map((s) => s.trim())
                      .filter(Boolean),
                  ),
                );
                const af2 =
                  r['Rephrased AF Lev.2'] ||
                  r['Rephrased AF Lev. 2'] ||
                  r['AF Lev.2'] ||
                  r['AF Level 2'] ||
                  r['Architecture Framework Level 2'] ||
                  '';
                return {
                  rephrasedRequirementId:
                    r['Rephrased Requirement ID'] ||
                    r['RephrasedRequirementId'] ||
                    r['RequirementId'] ||
                    '',
                  sourceRequirementId: r['Source Requirement ID'] || r['SourceRequirementId'] || '',
                  domain: r['Rephrased Domain'] || r['Domain'] || '',
                  vertical: r['Rephrased Vertical'] || r['Vertical'] || '',
                  functionName:
                    r['Rephrased Function Name'] || r['Function Name'] || r['Function'] || '',
                  afLevel2: af2,
                  capability: af2, // STRICT: only AF L2
                  referenceCapability: r['Reference Capability'] || r['Capability'] || '',
                  tags,
                };
              });
            } else {
              items = parseCSVToSpecSyncItems(String(reader.result || ''));
            }
            const state = buildSpecSyncState(items, file.name);
            resetSpecSyncUI(() => {});
            renderDynamicScopingFromImport(items);
            const dyn = mapSpecSyncByImportedCapabilities(items);
            state.selectedCapabilityIds = Object.keys(dyn.countsByCapability);
            saveSpecSyncData(state);
            updateCapabilityRequirementBadges(dyn.countsByCapability);
            applyImportedCapabilitySelections(state.selectedCapabilityIds || []);
            expandMappedDomainGroups(dyn.countsByCapability);
            renderImportedRequirementsPanel(state, dyn);
            // Floating toast summary
            const topCaps = Object.entries(dyn.countsByCapability)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 2)
              .map(([k, v]) => `${k}(${v})`)
              .join(', ');
            const toastMsg = `SpecSync imported: ${items.length} reqs · Domains ${new Set(items.map((it) => it.domain || 'Imported')).size}${topCaps ? ` · Top: ${topCaps}` : ''}`;
            if (window.showNotification) showNotification(toastMsg, 'success');
          } catch (err) {
            console.error('SpecSync import error:', err);
            if (window.showNotification)
              showNotification(`Failed to import SpecSync: ${err.message || 'Error'}`, 'error');
          }
        };
        reader.onerror = () => {
          if (window.showNotification) showNotification('Failed to read file', 'error');
        };
        if (/\.xlsx?$/i.test(file.name)) reader.readAsArrayBuffer(file);
        else reader.readAsText(file);
      } catch (err) {
        console.error('SpecSync delegated import error:', err);
        if (window.showNotification)
          showNotification(`Failed to import SpecSync: ${err.message || 'Error'}`, 'error');
      }
    } else if (clearBtn) {
      try {
        localStorage.removeItem('specsync-data');
      } catch (e) {}
      resetSpecSyncUI((t) => {
        const s = document.getElementById('specSyncSummary');
        if (s) s.textContent = t || '';
      });
      if (window.showNotification) showNotification('Cleared SpecSync import', 'info');
    }
  });
}

function resetSpecSyncUI(setSummary) {
  // Remove dynamic groups & badges, uncheck all checkboxes, clear panel & summary
  document.querySelectorAll('.domain-group.dynamic-imported-group').forEach((el) => el.remove());
  document.querySelectorAll('.capability-item .req-badge').forEach((el) => el.remove());
  document
    .querySelectorAll('.capability-item input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));
  const panel = document.getElementById('importedRequirementsPanel');
  if (panel) panel.remove();
  if (typeof setSummary === 'function') setSummary('');
  window.updateDomainCounts && window.updateDomainCounts();
}

function collapseAllDomainGroups() {
  document.querySelectorAll('.domain-group').forEach((g) => g.classList.add('collapsed'));
}

function expandMappedDomainGroups(countsByCapability) {
  if (!countsByCapability) return;
  // Expand any domain that contains a checked checkbox or a capability with a badge
  const domains = document.querySelectorAll('.domain-group');
  domains.forEach((group) => {
    const hasChecked = group.querySelector('.domain-capabilities input[type="checkbox"]:checked');
    const hasBadge = group.querySelector('.domain-capabilities .req-badge');
    if (hasChecked || hasBadge) {
      group.classList.remove('collapsed');
    }
  });
}

function applyTemplateData(templateData) {
  // Apply capabilities
  templateData.capabilities.forEach((capability) => {
    const checkbox =
      document.getElementById(capability) || document.getElementById(`capability-${capability}`);
    if (checkbox) checkbox.checked = true;
  });

  // Apply processes
  templateData.processes.forEach((process) => {
    const checkbox = document.getElementById(process);
    if (checkbox) checkbox.checked = true;
  });

  // Apply strategies
  const strategyTags = document.querySelectorAll('.strategy-tags .tag');
  strategyTags.forEach((tag) => {
    if (templateData.strategies.includes(tag.textContent)) {
      tag.classList.add('active');
    }
  });

  // Apply markets
  const marketToggles = document.querySelectorAll('.market-toggles input[type="checkbox"]');
  marketToggles.forEach((toggle) => {
    const label = toggle.parentElement.querySelector('span').textContent;
    toggle.checked = templateData.markets.includes(label);
  });

  // Update estimates
  updateEstimates();
}

// Dashboard Updates
function updateDashboardMetrics() {
  // Simulate real-time metric updates
  const metricValues = document.querySelectorAll('.metric-value');

  metricValues.forEach((metric) => {
    const currentValue = parseInt(metric.textContent);
    if (!isNaN(currentValue)) {
      // Add some random variation for demo purposes
      const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const newValue = Math.max(0, currentValue + variation);
      metric.textContent = newValue;
    }
  });
}

// Notification System
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 300px;
        animation: slideIn 0.3s ease;
    `;

  // Add close button functionality
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });

  // Add to page
  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Initial Data Loading
function loadInitialData() {
  // Load initial estimates
  updateEstimates();

  // Set up CR simulator
  setupCRSimulator();

  // Initialize domain counts
  updateDomainCounts();
}

// CR Simulator Setup
function setupCRSimulator() {
  const crTextarea = document.querySelector('#cr-simulator textarea');
  if (crTextarea) {
    crTextarea.addEventListener('input', () => {
      // Simulate real-time impact calculation
      setTimeout(() => {
        updateCRImpact(crTextarea.value);
      }, 500);
    });
  }
}

function updateCRImpact(scopeDescription) {
  // Simple impact calculation based on description length
  const impactItems = document.querySelectorAll('.impact-item .impact-value');

  if (impactItems.length >= 3) {
    const wordCount = scopeDescription.split(' ').length;

    // Timeline impact
    const timelineImpact = Math.ceil(wordCount / 10);
    impactItems[0].textContent = `+${timelineImpact} weeks`;

    // Cost impact
    const costImpact = timelineImpact * 75000;
    impactItems[1].textContent = `+$${costImpact.toLocaleString()}`;

    // Risk level
    const riskLevel = wordCount > 20 ? 'High' : wordCount > 10 ? 'Medium' : 'Low';
    impactItems[2].textContent = riskLevel;
    impactItems[2].className = `impact-value ${riskLevel.toLowerCase()}`;
  }
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);

// BOM Functionality
function setupBOMFunctionality() {
  // BOM generation button
  const generateBOMBtn = document.getElementById('generateBOM');
  if (generateBOMBtn) {
    generateBOMBtn.addEventListener('click', generateBOM);
  }

  // BOM export button
  const exportBOMBtn = document.getElementById('exportBOM');
  if (exportBOMBtn) {
    exportBOMBtn.addEventListener('click', exportBOM);
  }

  // Add service specification button
  const addServiceSpecBtn = document.getElementById('addServiceSpec');
  if (addServiceSpecBtn) {
    addServiceSpecBtn.addEventListener('click', addServiceSpecification);
  }

  // Add resource specification button
  const addResourceSpecBtn = document.getElementById('addResourceSpec');
  if (addResourceSpecBtn) {
    addResourceSpecBtn.addEventListener('click', addResourceSpecification);
  }

  // Set up service and resource item interactions
  setupBOMItemInteractions();

  // Initialize BOM with default data
  initializeBOM();
}

function generateBOM() {
  // Collect all BOM data
  const bomData = collectBOMData();

  // Update estimates based on BOM
  updateEstimatesFromBOM(bomData);

  // Update summary
  updateBOMSummary(bomData);

  // Show success message
  showNotification('BOM generated successfully!', 'success');

  console.log('Generated BOM:', bomData);
}

function collectBOMData() {
  const productSpec = {
    name: document.getElementById('productName')?.value || 'BSS Transformation',
    description: document.getElementById('productDescription')?.value || '',
    businessUnit: document.getElementById('businessUnit')?.value || 'consumer',
  };

  const serviceSpecs = [];
  const serviceItems = document.querySelectorAll('.service-spec-item');
  serviceItems.forEach((item) => {
    const serviceType = item.getAttribute('data-type');
    const serviceName = item.querySelector('.service-name')?.textContent || '';
    const servicePhase = item.querySelector('.service-phase')?.textContent || '';
    const serviceEffort = item.querySelector('.service-effort')?.textContent || '';
    const serviceCost = item.querySelector('.service-cost')?.textContent || '';

    serviceSpecs.push({
      type: serviceType,
      name: serviceName,
      phase: servicePhase,
      effort: serviceEffort,
      cost: serviceCost,
    });
  });

  const resourceSpecs = [];
  const resourceItems = document.querySelectorAll('.resource-spec-item');
  resourceItems.forEach((item) => {
    const resourceType = item.getAttribute('data-type');
    const resourceName = item.querySelector('.resource-name')?.textContent || '';
    const resourceRate = item.querySelector('.resource-rate')?.textContent || '';
    const resourceAvailability = item.querySelector('.resource-availability')?.textContent || '';

    resourceSpecs.push({
      type: resourceType,
      name: resourceName,
      rate: resourceRate,
      availability: resourceAvailability,
    });
  });

  return {
    productSpec,
    serviceSpecs,
    resourceSpecs,
    timestamp: new Date().toISOString(),
  };
}

function updateEstimatesFromBOM(bomData) {
  // Calculate total effort and cost from BOM
  let totalEffort = 0;
  let totalCost = 0;

  bomData.serviceSpecs.forEach((service) => {
    const effort = parseInt(service.effort.replace(' PD', '')) || 0;
    const cost = parseInt(service.cost.replace(/[$,]/g, '')) || 0;
    totalEffort += effort;
    totalCost += cost;
  });

  // Update the effort breakdown in the output panel
  updateEffortBreakdown(totalEffort);
  updateCostBreakdown(totalCost);
}

function updateEffortBreakdown(totalEffort) {
  // Update the total effort in the output panel
  const totalEffortElement = document.querySelector('.effort-item.total .days');
  if (totalEffortElement) {
    totalEffortElement.textContent = totalEffort;
  }

  // You could also update individual role breakdowns based on service types
  // This is a simplified version - in a real implementation, you'd map services to roles
}

function updateCostBreakdown(totalCost) {
  // Update the total cost in the output panel
  const totalCostElement = document.querySelector('.cost-item.total .cost-amount');
  if (totalCostElement) {
    totalCostElement.textContent = `$${totalCost.toLocaleString()}`;
  }

  // Update margin calculations
  const marginInfo = document.querySelector('.margin-info');
  if (marginInfo) {
    const acv = totalCost;
    const tcv = Math.round(acv * 1.27); // 27% markup for TCV
    const gm = Math.round(((tcv - acv) / tcv) * 100);

    marginInfo.innerHTML = `
            <span>Gross Margin: ${gm}%</span>
            <span>ACV: $${acv.toLocaleString()}</span>
            <span>TCV: $${tcv.toLocaleString()}</span>
        `;
  }
}

function updateBOMSummary(bomData) {
  const totalServices = bomData.serviceSpecs.length;
  const totalResources = bomData.resourceSpecs.length;

  let totalEffort = 0;
  let totalCost = 0;

  bomData.serviceSpecs.forEach((service) => {
    const effort = parseInt(service.effort.replace(' PD', '')) || 0;
    const cost = parseInt(service.cost.replace(/[$,]/g, '')) || 0;
    totalEffort += effort;
    totalCost += cost;
  });

  // Update summary stats
  const summaryStats = document.querySelector('.summary-stats');
  if (summaryStats) {
    summaryStats.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Total Services:</span>
                <span class="summary-value">${totalServices}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Resources:</span>
                <span class="summary-value">${totalResources}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Effort:</span>
                <span class="summary-value">${totalEffort} PD</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Cost:</span>
                <span class="summary-value">$${totalCost.toLocaleString()}</span>
            </div>
        `;
  }
}

function exportBOM() {
  const bomData = collectBOMData();

  // Create CSV content
  const csvContent = generateBOMCSV(bomData);

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BOM_${bomData.productSpec.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showNotification('BOM exported successfully!', 'success');
}

function generateBOMCSV(bomData) {
  let csv = '';

  // Header with project metadata
  csv += 'BOM Export - TMF SID Compliant Bill of Materials\n';
  csv += `Generated: ${new Date().toISOString()}\n`;
  csv += `Project: ${bomData.productSpec.name}\n`;
  csv += `Business Unit: ${bomData.productSpec.businessUnit}\n\n`;

  // Product Specification Section
  csv += '=== PRODUCT SPECIFICATION ===\n';
  csv += 'Field,Value,Description\n';
  csv += `"Product Name","${bomData.productSpec.name}","Top-level container for BSS transformation"\n`;
  csv += `"Product Description","${bomData.productSpec.description}","Detailed scope description"\n`;
  csv += `"Business Unit","${bomData.productSpec.businessUnit}","Target business unit"\n`;
  csv += `"SID Compliance","TMF SID v22.0","TM Forum Shared Information/Data Model"\n`;
  csv += `"Architecture Framework","ODA 2025","Open Digital Architecture"\n\n`;

  // Service Specifications Section - Detailed for estimation systems
  csv += '=== SERVICE SPECIFICATIONS ===\n';
  csv +=
    'Service ID,Service Type,Service Name,Service Phase,Effort (PD),Cost (USD),Rate Type,Complexity Level,Dependencies,Deliverables,Acceptance Criteria\n';

  let serviceId = 1;
  bomData.serviceSpecs.forEach((service) => {
    const effort = parseInt(service.effort.replace(' PD', '')) || 0;
    const cost = parseInt(service.cost.replace(/[$,]/g, '')) || 0;
    const ratePerDay = effort > 0 ? Math.round(cost / effort) : 0;

    // Determine complexity based on effort
    let complexity = 'Low';
    if (effort > 40) complexity = 'High';
    else if (effort > 20) complexity = 'Medium';

    // Generate dependencies and deliverables based on service type
    let dependencies = '';
    let deliverables = '';
    let acceptanceCriteria = '';

    if (service.type === 'cfs' && service.phase === 'Presales') {
      dependencies = 'Business Requirements, Stakeholder Approval';
      deliverables = 'Solution Design Document, Commercial Model, Pricing Sheet';
      acceptanceCriteria = 'Design approved by stakeholders, pricing model validated';
    } else if (service.type === 'rfs' && service.phase === 'Design') {
      dependencies = 'Solution Design, Technical Requirements';
      deliverables = 'Architecture Design, Technical Specifications, Integration Design';
      acceptanceCriteria = 'Architecture review completed, technical specs approved';
    } else if (service.type === 'rfs' && service.phase === 'Build') {
      dependencies = 'Architecture Design, Development Environment';
      deliverables = 'Developed Components, Unit Tests, Code Documentation';
      acceptanceCriteria = 'Code review passed, unit tests successful';
    } else if (service.type === 'rfs' && service.phase === 'Testing') {
      dependencies = 'Developed Components, Test Environment';
      deliverables = 'Test Results, Defect Reports, Test Documentation';
      acceptanceCriteria = 'All test cases passed, defects resolved';
    } else if (service.type === 'rfs' && service.phase === 'Migration') {
      dependencies = 'Data Mapping, Migration Tools';
      deliverables = 'Migration Scripts, Data Validation Reports, Rollback Plan';
      acceptanceCriteria = 'Data integrity verified, migration successful';
    } else if (service.type === 'rfs' && service.phase === 'Deployment') {
      dependencies = 'Production Environment, Deployment Scripts';
      deliverables = 'Deployed System, Deployment Documentation, Go-Live Report';
      acceptanceCriteria = 'System operational, performance metrics met';
    } else if (service.type === 'cfs' && service.phase === 'Post-Deployment') {
      dependencies = 'Live System, Support Team';
      deliverables = 'Support Reports, Issue Resolution, Performance Monitoring';
      acceptanceCriteria = 'System stable, support SLAs met';
    } else if (service.type === 'cfs' && service.phase === 'Warranty') {
      dependencies = 'Live System, Warranty Terms';
      deliverables = 'Warranty Support, Bug Fixes, Performance Optimization';
      acceptanceCriteria = 'Warranty period completed, system optimized';
    }

    csv += `"SVC-${serviceId.toString().padStart(3, '0')}","${service.type.toUpperCase()}","${service.name}","${service.phase}","${effort}","${cost}","$${ratePerDay}/day","${complexity}","${dependencies}","${deliverables}","${acceptanceCriteria}"\n`;
    serviceId++;
  });

  csv += '\n';

  // Resource Specifications Section - Detailed for resource planning
  csv += '=== RESOURCE SPECIFICATIONS ===\n';
  csv +=
    'Resource ID,Resource Type,Resource Name,Rate (USD),Availability,Skills Required,Experience Level,Location,Allocation %,Start Date,End Date,Cost Center\n';

  let resourceId = 1;
  bomData.resourceSpecs.forEach((resource) => {
    const rate = resource.rate.replace(/[$,]/g, '');
    const isDailyRate = resource.rate.includes('/day');
    const isLicensed = resource.availability === 'Licensed';

    // Generate resource details based on type
    let skillsRequired = '';
    let experienceLevel = '';
    let location = '';
    let allocation = '';
    let startDate = '';
    let endDate = '';
    let costCenter = '';

    if (resource.type === 'skills') {
      if (resource.name.includes('Architect')) {
        skillsRequired = 'TMF SID, ODA, Enterprise Architecture, BSS Systems';
        experienceLevel = 'Senior (8+ years)';
        location = 'Remote/On-site';
        allocation = '100%';
        startDate = 'Project Start';
        endDate = 'Project End';
        costCenter = 'Architecture';
      } else if (resource.name.includes('Integrator')) {
        skillsRequired = 'API Integration, Middleware, ETL, Data Mapping';
        experienceLevel = 'Mid-Senior (5+ years)';
        location = 'Remote/On-site';
        allocation = '100%';
        startDate = 'Design Phase';
        endDate = 'Testing Phase';
        costCenter = 'Integration';
      } else if (resource.name.includes('Developer')) {
        skillsRequired = 'Java, Spring Boot, REST APIs, Database Design';
        experienceLevel = 'Mid-Level (3+ years)';
        location = 'Remote/On-site';
        allocation = '100%';
        startDate = 'Build Phase';
        endDate = 'Testing Phase';
        costCenter = 'Development';
      }
    } else if (resource.type === 'tools') {
      skillsRequired = 'Tool Administration, License Management';
      experienceLevel = 'N/A';
      location = 'Cloud/On-premise';
      allocation = 'N/A';
      startDate = 'Project Start';
      endDate = 'Project End';
      costCenter = 'Tools & Infrastructure';
    }

    csv += `"RES-${resourceId.toString().padStart(3, '0')}","${resource.type.toUpperCase()}","${resource.name}","${rate}","${resource.availability}","${skillsRequired}","${experienceLevel}","${location}","${allocation}","${startDate}","${endDate}","${costCenter}"\n`;
    resourceId++;
  });

  csv += '\n';

  // Work Breakdown Structure (WBS) Section
  csv += '=== WORK BREAKDOWN STRUCTURE ===\n';
  csv +=
    'WBS ID,Parent WBS,Task Name,Task Type,Effort (PD),Cost (USD),Predecessors,Successors,Critical Path,Risk Level,Quality Gates\n';

  let wbsId = 1;
  const phases = [
    'Presales',
    'Design',
    'Build',
    'Testing',
    'Migration',
    'Deployment',
    'Post-Deployment',
    'Warranty',
  ];

  phases.forEach((phase, phaseIndex) => {
    const phaseServices = bomData.serviceSpecs.filter((s) => s.phase === phase);
    const phaseEffort = phaseServices.reduce(
      (sum, s) => sum + (parseInt(s.effort.replace(' PD', '')) || 0),
      0,
    );
    const phaseCost = phaseServices.reduce(
      (sum, s) => sum + (parseInt(s.cost.replace(/[$,]/g, '')) || 0),
      0,
    );

    // WBS Level 1 - Phase
    csv += `"WBS-${wbsId.toString().padStart(3, '0')}","","${phase} Phase","Phase","${phaseEffort}","${phaseCost}","","","${phaseIndex === 0 ? 'Yes' : 'No'}","Medium","Phase Gate Review"\n`;
    const parentWbs = wbsId;
    wbsId++;

    // WBS Level 2 - Services within phase
    phaseServices.forEach((service) => {
      const effort = parseInt(service.effort.replace(' PD', '')) || 0;
      const cost = parseInt(service.cost.replace(/[$,]/g, '')) || 0;

      let predecessors = '';
      let successors = '';
      let criticalPath = 'No';
      let riskLevel = 'Low';
      let qualityGates = '';

      if (phase === 'Presales') {
        predecessors = 'Project Initiation';
        successors = 'Design Phase';
        qualityGates = 'Stakeholder Approval, Design Sign-off';
      } else if (phase === 'Design') {
        predecessors = 'Presales Phase';
        successors = 'Build Phase';
        criticalPath = 'Yes';
        qualityGates = 'Architecture Review, Technical Design Approval';
      } else if (phase === 'Build') {
        predecessors = 'Design Phase';
        successors = 'Testing Phase';
        criticalPath = 'Yes';
        riskLevel = 'Medium';
        qualityGates = 'Code Review, Unit Test Completion';
      } else if (phase === 'Testing') {
        predecessors = 'Build Phase';
        successors = 'Migration Phase';
        criticalPath = 'Yes';
        qualityGates = 'Test Case Execution, Defect Resolution';
      } else if (phase === 'Migration') {
        predecessors = 'Testing Phase';
        successors = 'Deployment Phase';
        riskLevel = 'High';
        qualityGates = 'Data Validation, Migration Testing';
      } else if (phase === 'Deployment') {
        predecessors = 'Migration Phase';
        successors = 'Post-Deployment Phase';
        criticalPath = 'Yes';
        riskLevel = 'High';
        qualityGates = 'Go-Live Readiness, Production Deployment';
      } else if (phase === 'Post-Deployment') {
        predecessors = 'Deployment Phase';
        successors = 'Warranty Phase';
        qualityGates = 'Hypercare Period, Performance Validation';
      } else if (phase === 'Warranty') {
        predecessors = 'Post-Deployment Phase';
        successors = 'Project Closure';
        qualityGates = 'Warranty Period, Final Acceptance';
      }

      csv += `"WBS-${wbsId.toString().padStart(3, '0')}","WBS-${parentWbs.toString().padStart(3, '0')}","${service.name}","Service","${effort}","${cost}","${predecessors}","${successors}","${criticalPath}","${riskLevel}","${qualityGates}"\n`;
      wbsId++;
    });
  });

  csv += '\n';

  // Cost Breakdown Section
  csv += '=== COST BREAKDOWN ===\n';
  csv +=
    'Cost Category,Subcategory,Amount (USD),Percentage,Cost Type,Billing Frequency,Payment Terms\n';

  const totalCost = bomData.serviceSpecs.reduce(
    (sum, s) => sum + (parseInt(s.cost.replace(/[$,]/g, '')) || 0),
    0,
  );
  const totalResourceCost = bomData.resourceSpecs.reduce((sum, r) => {
    const rate = parseInt(r.rate.replace(/[$,]/g, '')) || 0;
    return sum + rate;
  }, 0);

  // Service costs by phase
  const phaseCosts = {};
  bomData.serviceSpecs.forEach((service) => {
    const cost = parseInt(service.cost.replace(/[$,]/g, '')) || 0;
    if (!phaseCosts[service.phase]) phaseCosts[service.phase] = 0;
    phaseCosts[service.phase] += cost;
  });

  Object.entries(phaseCosts).forEach(([phase, cost]) => {
    const percentage = ((cost / totalCost) * 100).toFixed(1);
    csv += `"Professional Services","${phase} Services","${cost}","${percentage}%","Time & Materials","Monthly","Net 30"\n`;
  });

  // Resource costs
  const skillsCost = bomData.resourceSpecs
    .filter((r) => r.type === 'skills')
    .reduce((sum, r) => sum + (parseInt(r.rate.replace(/[$,]/g, '')) || 0), 0);
  const toolsCost = bomData.resourceSpecs
    .filter((r) => r.type === 'tools')
    .reduce((sum, r) => sum + (parseInt(r.rate.replace(/[$,]/g, '')) || 0), 0);

  if (skillsCost > 0) {
    const percentage = ((skillsCost / totalCost) * 100).toFixed(1);
    csv += `"Resource Costs","Skills & Labor","${skillsCost}","${percentage}%","Fixed Price","Upfront","Net 30"\n`;
  }

  if (toolsCost > 0) {
    const percentage = ((toolsCost / totalCost) * 100).toFixed(1);
    csv += `"Resource Costs","Tools & Licenses","${toolsCost}","${percentage}%","Fixed Price","Upfront","Net 30"\n`;
  }

  csv += `"Total Project Cost","","${totalCost}","100%","","",""\n`;

  csv += '\n';

  // Risk Assessment Section
  csv += '=== RISK ASSESSMENT ===\n';
  csv +=
    'Risk ID,Risk Category,Risk Description,Probability,Impact,Severity,Mitigation Strategy,Contingency Plan,Owner\n';

  const risks = [
    [
      'R001',
      'Technical',
      'Integration complexity with legacy systems',
      'Medium',
      'High',
      'High',
      'Early prototyping and proof of concept',
      'Additional integration specialists',
      'Technical Lead',
    ],
    [
      'R002',
      'Schedule',
      'Resource availability during peak periods',
      'Medium',
      'Medium',
      'Medium',
      'Resource planning and backup resources',
      'Extended timeline or additional resources',
      'Project Manager',
    ],
    [
      'R003',
      'Data',
      'Data migration complexity and quality issues',
      'High',
      'High',
      'High',
      'Comprehensive data profiling and validation',
      'Phased migration approach',
      'Data Architect',
    ],
    [
      'R004',
      'Business',
      'Stakeholder alignment and requirement changes',
      'Medium',
      'High',
      'High',
      'Regular stakeholder communication and change management',
      'Scope freeze and change control process',
      'Business Analyst',
    ],
    [
      'R005',
      'Technical',
      'Performance issues with high transaction volumes',
      'Low',
      'High',
      'Medium',
      'Performance testing and optimization',
      'Infrastructure scaling',
      'Performance Engineer',
    ],
  ];

  risks.forEach((risk) => {
    csv += `"${risk[0]}","${risk[1]}","${risk[2]}","${risk[3]}","${risk[4]}","${risk[5]}","${risk[6]}","${risk[7]}","${risk[8]}"\n`;
  });

  csv += '\n';

  // Quality Assurance Section
  csv += '=== QUALITY ASSURANCE ===\n';
  csv += 'QA ID,Quality Gate,Phase,Success Criteria,Reviewers,Approval Required,Status\n';

  const qualityGates = [
    [
      'QG001',
      'Requirements Review',
      'Presales',
      'All requirements documented and approved',
      'Business Analyst, Stakeholders',
      'Yes',
      'Pending',
    ],
    [
      'QG002',
      'Architecture Review',
      'Design',
      'Architecture design approved by technical committee',
      'Solution Architect, Technical Lead',
      'Yes',
      'Pending',
    ],
    [
      'QG003',
      'Code Review',
      'Build',
      'All code reviewed and approved',
      'Senior Developer, Technical Lead',
      'Yes',
      'Pending',
    ],
    [
      'QG004',
      'Test Completion',
      'Testing',
      'All test cases executed and passed',
      'QA Lead, Test Manager',
      'Yes',
      'Pending',
    ],
    [
      'QG005',
      'Go-Live Readiness',
      'Deployment',
      'All pre-go-live criteria met',
      'Project Manager, Operations Team',
      'Yes',
      'Pending',
    ],
  ];

  qualityGates.forEach((qg) => {
    csv += `"${qg[0]}","${qg[1]}","${qg[2]}","${qg[3]}","${qg[4]}","${qg[5]}","${qg[6]}"\n`;
  });

  return csv;
}

function addServiceSpecification() {
  const serviceSpecs = document.querySelector('.service-specs');
  const newService = createServiceSpecificationItem();
  serviceSpecs.appendChild(newService);

  // Add to the first available category (Presales Services)
  const presalesCategory = serviceSpecs.querySelector('.service-category');
  if (presalesCategory) {
    presalesCategory.appendChild(newService);
  }
}

function createServiceSpecificationItem() {
  const serviceItem = document.createElement('div');
  serviceItem.className = 'service-spec-item';
  serviceItem.setAttribute('data-type', 'cfs');

  serviceItem.innerHTML = `
        <div class="service-header">
            <span class="service-type cfs">CFS</span>
            <span class="service-name">New Service</span>
            <div class="service-actions">
                <button class="btn-small" onclick="editServiceSpec(this)"><i class="fas fa-edit"></i></button>
                <button class="btn-small" onclick="deleteServiceSpec(this)"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="service-details">
            <span class="service-phase">Presales</span>
            <span class="service-effort">5 PD</span>
            <span class="service-cost">$25,000</span>
        </div>
    `;

  return serviceItem;
}

function addResourceSpecification() {
  const resourceSpecs = document.querySelector('.resource-specs');
  const newResource = createResourceSpecificationItem();
  resourceSpecs.appendChild(newResource);

  // Add to the first available category (Skills Profiles)
  const skillsCategory = resourceSpecs.querySelector('.resource-category');
  if (skillsCategory) {
    skillsCategory.appendChild(newResource);
  }
}

function createResourceSpecificationItem() {
  const resourceItem = document.createElement('div');
  resourceItem.className = 'resource-spec-item';
  resourceItem.setAttribute('data-type', 'skills');

  resourceItem.innerHTML = `
        <div class="resource-header">
            <span class="resource-type skills">Skills</span>
            <span class="resource-name">New Resource</span>
            <div class="resource-actions">
                <button class="btn-small" onclick="editResourceSpec(this)"><i class="fas fa-edit"></i></button>
                <button class="btn-small" onclick="deleteResourceSpec(this)"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="resource-details">
            <span class="resource-rate">$1,000/day</span>
            <span class="resource-availability">Available</span>
        </div>
    `;

  return resourceItem;
}

function setupBOMItemInteractions() {
  // Set up edit and delete functionality for existing items
  document.addEventListener('click', function (e) {
    if (e.target.closest('.service-actions .btn-small')) {
      const button = e.target.closest('.service-actions .btn-small');
      if (button.querySelector('.fa-edit')) {
        editServiceSpec(button);
      } else if (button.querySelector('.fa-trash')) {
        deleteServiceSpec(button);
      }
    }

    if (e.target.closest('.resource-actions .btn-small')) {
      const button = e.target.closest('.resource-actions .btn-small');
      if (button.querySelector('.fa-edit')) {
        editResourceSpec(button);
      } else if (button.querySelector('.fa-trash')) {
        deleteResourceSpec(button);
      }
    }
  });
}

function editServiceSpec(button) {
  const serviceItem = button.closest('.service-spec-item');
  const serviceName = serviceItem.querySelector('.service-name');

  // Create inline editor
  const currentName = serviceName.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'edit-input';

  input.addEventListener('blur', function () {
    serviceName.textContent = input.value;
    generateBOM(); // Regenerate BOM to update estimates
  });

  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      input.blur();
    }
  });

  serviceName.textContent = '';
  serviceName.appendChild(input);
  input.focus();
}

function deleteServiceSpec(button) {
  const serviceItem = button.closest('.service-spec-item');
  if (confirm('Are you sure you want to delete this service specification?')) {
    serviceItem.remove();
    generateBOM(); // Regenerate BOM to update estimates
  }
}

function editResourceSpec(button) {
  const resourceItem = button.closest('.resource-spec-item');
  const resourceName = resourceItem.querySelector('.resource-name');

  // Create inline editor
  const currentName = resourceName.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'edit-input';

  input.addEventListener('blur', function () {
    resourceName.textContent = input.value;
    generateBOM(); // Regenerate BOM to update estimates
  });

  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      input.blur();
    }
  });

  resourceName.textContent = '';
  resourceName.appendChild(input);
  input.focus();
}

function deleteResourceSpec(button) {
  const resourceItem = button.closest('.resource-spec-item');
  if (confirm('Are you sure you want to delete this resource specification?')) {
    resourceItem.remove();
    generateBOM(); // Regenerate BOM to update estimates
  }
}

function initializeBOM() {
  // Set up initial BOM data
  const bomData = collectBOMData();
  updateBOMSummary(bomData);

  // Set up form change listeners
  const productNameInput = document.getElementById('productName');
  const productDescriptionInput = document.getElementById('productDescription');
  const businessUnitSelect = document.getElementById('businessUnit');

  [productNameInput, productDescriptionInput, businessUnitSelect].forEach((element) => {
    if (element) {
      element.addEventListener('change', () => {
        generateBOM();
      });
    }
  });
}

// Output Panel BOM Integration
function setupOutputPanelBOM() {
  const downloadBOMBtn = document.getElementById('downloadBOM');
  if (downloadBOMBtn) {
    downloadBOMBtn.addEventListener('click', () => {
      // Generate BOM first to ensure it's up to date
      generateBOM();
      // Then export it
      exportBOM();
    });
  }
}

// UI Toggle Functionality
function setupUIToggle() {
  const toggleBtn = document.getElementById('uiToggle');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentUrl = window.location.href;

      if (currentUrl.includes('modern-ui.html')) {
        // Switch to classic UI
        window.location.href = 'index.html';
      } else {
        // Switch to modern UI
        window.location.href = 'modern-ui.html';
      }
    });
  }
}

// ADO Integration Functionality
function setupADOIntegration() {
  // ADO work item generation button
  const generateADOItemsBtn = document.getElementById('generateADOItems');
  if (generateADOItemsBtn) {
    generateADOItemsBtn.addEventListener('click', generateADOWorkItems);
  }

  // ADO JSON payload export button
  const exportADOPayloadBtn = document.getElementById('exportADOPayload');
  if (exportADOPayloadBtn) {
    exportADOPayloadBtn.addEventListener('click', exportADOPayload);
  }

  // Add work item template button
  const addWorkItemTemplateBtn = document.getElementById('addWorkItemTemplate');
  if (addWorkItemTemplateBtn) {
    addWorkItemTemplateBtn.addEventListener('click', addWorkItemTemplate);
  }

  // Refresh preview button
  const refreshPreviewBtn = document.getElementById('refreshPreview');
  if (refreshPreviewBtn) {
    refreshPreviewBtn.addEventListener('click', refreshWorkItemsPreview);
  }

  // Set up preview tabs
  setupPreviewTabs();

  // Set up work item template interactions
  setupWorkItemTemplateInteractions();

  // Initialize ADO integration
  initializeADOIntegration();
}

function setupPreviewTabs() {
  const previewTabs = document.querySelectorAll('.preview-tab');
  const previewPanes = document.querySelectorAll('.preview-pane');

  previewTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetPreview = tab.getAttribute('data-preview');

      // Remove active class from all tabs and panes
      previewTabs.forEach((t) => t.classList.remove('active'));
      previewPanes.forEach((p) => p.classList.remove('active'));

      // Add active class to clicked tab and corresponding pane
      tab.classList.add('active');
      const targetPane = document.getElementById(`${targetPreview}-preview`);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });
}

function setupWorkItemTemplateInteractions() {
  // Set up edit and delete buttons for work item templates
  const templateActions = document.querySelectorAll('.template-actions button');
  templateActions.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = button.querySelector('i').classList.contains('fa-edit') ? 'edit' : 'delete';
      const template = button.closest('.work-item-template');
      const templateType = template.getAttribute('data-type');

      if (action === 'edit') {
        editWorkItemTemplate(template, templateType);
      } else {
        deleteWorkItemTemplate(template, templateType);
      }
    });
  });
}

function generateADOWorkItems() {
  // Collect BOM data
  const bomData = collectBOMData();

  // Generate ADO work items from BOM
  const adoWorkItems = generateWorkItemsFromBOM(bomData);

  // Update preview with generated work items
  updateWorkItemsPreview(adoWorkItems);

  // Update integration status
  updateIntegrationStatus(adoWorkItems.length);

  // Show success message
  showNotification(`Generated ${adoWorkItems.length} ADO work items successfully!`, 'success');

  console.log('Generated ADO Work Items:', adoWorkItems);
}

function generateWorkItemsFromBOM(bomData) {
  const workItems = [];

  // Generate Epic from Product Specification
  const epic = {
    type: 'epic',
    title: bomData.productSpec.name,
    description: bomData.productSpec.description,
    businessValue: 'High',
    risk: 'Medium',
    areaPath: document.getElementById('adoAreaPath')?.value || 'Mobily-BSS-Transform\\Delivery',
    iterationPath:
      document.getElementById('adoIterationPath')?.value || 'Mobily-BSS-Transform\\2025\\Q1',
    tags: ['BSS-Transformation', 'Epic', bomData.productSpec.businessUnit],
    fields: {
      'System.Title': bomData.productSpec.name,
      'System.Description': bomData.productSpec.description,
      'Microsoft.VSTS.Common.BusinessValue': 1000,
      'Microsoft.VSTS.Common.Risk': 'Medium',
      'System.AreaPath':
        document.getElementById('adoAreaPath')?.value || 'Mobily-BSS-Transform\\Delivery',
      'System.IterationPath':
        document.getElementById('adoIterationPath')?.value || 'Mobily-BSS-Transform\\2025\\Q1',
      'System.Tags': 'BSS-Transformation;Epic;' + bomData.productSpec.businessUnit,
    },
  };
  workItems.push(epic);

  // Generate Features from CFS Services
  bomData.serviceSpecs.forEach((service, index) => {
    if (service.type === 'cfs') {
      const feature = {
        type: 'feature',
        title: service.name,
        description: `Feature for ${service.name} service delivery`,
        businessValue: 'High',
        acceptanceCriteria: `${service.name} service specification completed and approved`,
        areaPath: document.getElementById('adoAreaPath')?.value || 'Mobily-BSS-Transform\\Delivery',
        iterationPath:
          document.getElementById('adoIterationPath')?.value || 'Mobily-BSS-Transform\\2025\\Q1',
        tags: ['CFS', 'Service', service.phase],
        fields: {
          'System.Title': service.name,
          'System.Description': `Feature for ${service.name} service delivery`,
          'Microsoft.VSTS.Common.BusinessValue': 800,
          'Microsoft.VSTS.Common.AcceptanceCriteria': `${service.name} service specification completed and approved`,
          'System.AreaPath':
            document.getElementById('adoAreaPath')?.value || 'Mobily-BSS-Transform\\Delivery',
          'System.IterationPath':
            document.getElementById('adoIterationPath')?.value || 'Mobily-BSS-Transform\\2025\\Q1',
          'System.Tags': `CFS;Service;${service.phase}`,
          'Custom.ServiceType': service.type,
          'Custom.ServicePhase': service.phase,
          'Custom.Effort': service.effort,
          'Custom.Cost': service.cost,
        },
      };
      workItems.push(feature);
    }
  });

  // Generate User Stories from RFS Services
  bomData.serviceSpecs.forEach((service, index) => {
    if (service.type === 'rfs') {
      const userStory = {
        type: 'userstory',
        title: service.name,
        description: `User story for ${service.name} delivery`,
        storyPoints: calculateStoryPoints(service.effort),
        acceptanceCriteria: `${service.name} delivered according to specification`,
        areaPath: document.getElementById('adoAreaPath')?.value || 'Mobily-BSS-Transform\\Delivery',
        iterationPath:
          document.getElementById('adoIterationPath')?.value || 'Mobily-BSS-Transform\\2025\\Q1',
        tags: ['RFS', 'Service', service.phase],
        fields: {
          'System.Title': service.name,
          'System.Description': `User story for ${service.name} delivery`,
          'Microsoft.VSTS.Common.StoryPoints': calculateStoryPoints(service.effort),
          'Microsoft.VSTS.Common.AcceptanceCriteria': `${service.name} delivered according to specification`,
          'System.AreaPath':
            document.getElementById('adoAreaPath')?.value || 'Mobily-BSS-Transform\\Delivery',
          'System.IterationPath':
            document.getElementById('adoIterationPath')?.value || 'Mobily-BSS-Transform\\2025\\Q1',
          'System.Tags': `RFS;Service;${service.phase}`,
          'Custom.ServiceType': service.type,
          'Custom.ServicePhase': service.phase,
          'Custom.Effort': service.effort,
          'Custom.Cost': service.cost,
        },
      };
      workItems.push(userStory);
    }
  });

  // Generate Tasks from Resource Specifications
  bomData.resourceSpecs.forEach((resource, index) => {
    const task = {
      type: 'task',
      title: resource.name,
      description: `Task for ${resource.name} resource`,
      remainingWork: convertEffortToHours(resource.rate),
      activity: determineActivity(resource.type),
      areaPath: document.getElementById('adoAreaPath')?.value || 'Mobily-BSS-Transform\\Delivery',
      iterationPath:
        document.getElementById('adoIterationPath')?.value || 'Mobily-BSS-Transform\\2025\\Q1',
      tags: [resource.type, 'Resource', 'Task'],
      fields: {
        'System.Title': resource.name,
        'System.Description': `Task for ${resource.name} resource`,
        'Microsoft.VSTS.Scheduling.RemainingWork': convertEffortToHours(resource.rate),
        'Microsoft.VSTS.Scheduling.Activity': determineActivity(resource.type),
        'System.AreaPath':
          document.getElementById('adoAreaPath')?.value || 'Mobily-BSS-Transform\\Delivery',
        'System.IterationPath':
          document.getElementById('adoIterationPath')?.value || 'Mobily-BSS-Transform\\2025\\Q1',
        'System.Tags': `${resource.type};Resource;Task`,
        'Custom.ResourceType': resource.type,
        'Custom.ResourceRate': resource.rate,
        'Custom.ResourceAvailability': resource.availability,
      },
    };
    workItems.push(task);
  });

  return workItems;
}

function calculateStoryPoints(effort) {
  // Convert effort (e.g., "32 PD") to story points
  const effortValue = parseInt(effort.replace(' PD', '')) || 0;

  // Simple conversion: 1 PD = 1 story point
  // In a real scenario, you might have more sophisticated mapping
  return effortValue;
}

function convertEffortToHours(rate) {
  // Convert rate (e.g., "$1,200/day") to hours
  // Assuming 8 hours per day
  const dailyRate = parseInt(rate.replace(/[$,]/g, '')) || 0;
  return dailyRate > 0 ? 8 : 0; // Default to 8 hours if rate is available
}

function determineActivity(resourceType) {
  // Map resource type to ADO activity
  const activityMap = {
    skills: 'Development',
    tools: 'Design',
    infrastructure: 'Infrastructure',
  };
  return activityMap[resourceType] || 'Development';
}

function updateWorkItemsPreview(workItems) {
  // Group work items by type
  const epics = workItems.filter((item) => item.type === 'epic');
  const features = workItems.filter((item) => item.type === 'feature');
  const userStories = workItems.filter((item) => item.type === 'userstory');
  const tasks = workItems.filter((item) => item.type === 'task');

  // Update Epic preview
  updatePreviewPane('epics', epics);

  // Update Feature preview
  updatePreviewPane('features', features);

  // Update User Story preview
  updatePreviewPane('stories', userStories);

  // Update Task preview
  updatePreviewPane('tasks', tasks);
}

function updatePreviewPane(previewType, items) {
  const previewPane = document.getElementById(`${previewType}-preview`);
  if (!previewPane) return;

  let previewHTML = '';

  if (items.length === 0) {
    previewHTML =
      '<div class="work-item-preview-item"><span class="preview-field">No items to display</span></div>';
  } else {
    items.forEach((item) => {
      previewHTML += `
                <div class="work-item-preview-item">
                    <div class="preview-header">
                        <span class="preview-type ${item.type}">${item.type}</span>
                        <span class="preview-title">${item.title}</span>
                    </div>
                    <div class="preview-details">
                        ${generatePreviewFields(item)}
                    </div>
                </div>
            `;
    });
  }

  previewPane.innerHTML = previewHTML;
}

function generatePreviewFields(item) {
  let fields = '';

  switch (item.type) {
    case 'epic':
      fields = `
                <span class="preview-field">Business Value: ${item.businessValue}</span>
                <span class="preview-field">Risk: ${item.risk}</span>
                <span class="preview-field">Area Path: ${item.areaPath}</span>
            `;
      break;
    case 'feature':
      fields = `
                <span class="preview-field">Business Value: ${item.businessValue}</span>
                <span class="preview-field">Acceptance Criteria: ${item.acceptanceCriteria}</span>
            `;
      break;
    case 'userstory':
      fields = `
                <span class="preview-field">Story Points: ${item.storyPoints}</span>
                <span class="preview-field">Acceptance Criteria: ${item.acceptanceCriteria}</span>
            `;
      break;
    case 'task':
      fields = `
                <span class="preview-field">Remaining Work: ${item.remainingWork}h</span>
                <span class="preview-field">Activity: ${item.activity}</span>
            `;
      break;
  }

  return fields;
}

function updateIntegrationStatus(workItemsCount) {
  const workItemsCreatedElement = document.querySelector('.status-item .status-value');
  if (workItemsCreatedElement) {
    workItemsCreatedElement.textContent = workItemsCount;
  }

  const lastSyncElement = document.querySelector('.status-item:nth-child(2) .status-value');
  if (lastSyncElement) {
    const now = new Date();
    lastSyncElement.textContent = now.toLocaleString();
  }
}

function exportADOPayload() {
  // Collect BOM data
  const bomData = collectBOMData();

  // Generate ADO work items
  const adoWorkItems = generateWorkItemsFromBOM(bomData);

  // Create the complete ADO integration payload
  const adoPayload = {
    metadata: {
      organization: document.getElementById('adoOrgUrl')?.value || 'https://dev.azure.com/your-org',
      project: document.getElementById('adoProject')?.value || 'Mobily-BSS-Transform',
      areaPath: document.getElementById('adoAreaPath')?.value || 'Mobily-BSS-Transform\\Delivery',
      iterationPath:
        document.getElementById('adoIterationPath')?.value || 'Mobily-BSS-Transform\\2025\\Q1',
      generatedAt: new Date().toISOString(),
      version: '1.0',
    },
    workItems: adoWorkItems,
    relationships: generateWorkItemRelationships(adoWorkItems),
    customFields: generateCustomFields(),
    apiEndpoints: generateAPIEndpoints(),
  };

  // Export as JSON file
  const dataStr = JSON.stringify(adoPayload, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `ado-integration-payload-${new Date().toISOString().split('T')[0]}.json`;
  link.click();

  showNotification('ADO integration payload exported successfully!', 'success');

  console.log('Exported ADO Payload:', adoPayload);
}

function generateWorkItemRelationships(workItems) {
  const relationships = [];

  // Find the epic
  const epic = workItems.find((item) => item.type === 'epic');

  if (epic) {
    // Link features to epic
    workItems
      .filter((item) => item.type === 'feature')
      .forEach((feature) => {
        relationships.push({
          source: feature.title,
          target: epic.title,
          type: 'Child',
          relationshipType: 'System.LinkTypes.Hierarchy-Forward',
        });
      });

    // Link user stories to features
    workItems
      .filter((item) => item.type === 'feature')
      .forEach((feature) => {
        const relatedStories = workItems.filter(
          (item) =>
            item.type === 'userstory' &&
            item.fields['Custom.ServicePhase'] === feature.fields['Custom.ServicePhase'],
        );

        relatedStories.forEach((story) => {
          relationships.push({
            source: story.title,
            target: feature.title,
            type: 'Child',
            relationshipType: 'System.LinkTypes.Hierarchy-Forward',
          });
        });
      });

    // Link tasks to user stories
    workItems
      .filter((item) => item.type === 'userstory')
      .forEach((story) => {
        const relatedTasks = workItems.filter(
          (item) => item.type === 'task' && item.fields['Custom.ResourceType'] === 'skills',
        );

        relatedTasks.forEach((task) => {
          relationships.push({
            source: task.title,
            target: story.title,
            type: 'Child',
            relationshipType: 'System.LinkTypes.Hierarchy-Forward',
          });
        });
      });
  }

  return relationships;
}

function generateCustomFields() {
  return {
    'Custom.ServiceType': {
      type: 'String',
      description: 'Type of service (CFS/RFS)',
      allowedValues: ['CFS', 'RFS'],
    },
    'Custom.ServicePhase': {
      type: 'String',
      description: 'Phase of service delivery',
      allowedValues: [
        'Presales',
        'Design',
        'Build',
        'Testing',
        'Migration',
        'Deployment',
        'Post-Deployment',
        'Warranty',
      ],
    },
    'Custom.Effort': {
      type: 'String',
      description: 'Effort estimation in person days',
      format: 'XX PD',
    },
    'Custom.Cost': {
      type: 'String',
      description: 'Cost estimation in USD',
      format: '$XX,XXX',
    },
    'Custom.ResourceType': {
      type: 'String',
      description: 'Type of resource',
      allowedValues: ['Skills', 'Tools', 'Infrastructure'],
    },
    'Custom.ResourceRate': {
      type: 'String',
      description: 'Resource rate or cost',
      format: '$X,XXX/day or $XX,XXX',
    },
    'Custom.ResourceAvailability': {
      type: 'String',
      description: 'Resource availability status',
      allowedValues: ['Available', 'Limited', 'Unavailable', 'Licensed'],
    },
  };
}

function generateAPIEndpoints() {
  return {
    baseUrl: 'https://dev.azure.com/{organization}/{project}',
    workItems: {
      create: '/_apis/wit/workitems/$epic?api-version=7.0',
      update: '/_apis/wit/workitems/{id}?api-version=7.0',
      get: '/_apis/wit/workitems/{id}?api-version=7.0',
      delete: '/_apis/wit/workitems/{id}?api-version=7.0',
    },
    workItemTypes: {
      list: '/_apis/wit/workItemTypes?api-version=7.0',
      get: '/_apis/wit/workItemTypes/{type}?api-version=7.0',
    },
    fields: {
      list: '/_apis/wit/fields?api-version=7.0',
      get: '/_apis/wit/fields/{fieldName}?api-version=7.0',
    },
    areas: {
      list: '/_apis/wit/classificationNodes/areas?api-version=7.0',
    },
    iterations: {
      list: '/_apis/wit/classificationNodes/iterations?api-version=7.0',
    },
  };
}

function addWorkItemTemplate() {
  // Implementation for adding new work item templates
  showNotification('Add template functionality coming soon!', 'info');
}

function refreshWorkItemsPreview() {
  // Refresh the work items preview
  const bomData = collectBOMData();
  const adoWorkItems = generateWorkItemsFromBOM(bomData);
  updateWorkItemsPreview(adoWorkItems);

  showNotification('Work items preview refreshed!', 'success');
}

function editWorkItemTemplate(template, templateType) {
  // Implementation for editing work item templates
  showNotification(`Edit ${templateType} template functionality coming soon!`, 'info');
}

function deleteWorkItemTemplate(template, templateType) {
  // Implementation for deleting work item templates
  if (confirm(`Are you sure you want to delete the ${templateType} template?`)) {
    template.remove();
    showNotification(`${templateType} template deleted!`, 'success');
  }
}

function initializeADOIntegration() {
  // Set default values for ADO configuration
  const defaultConfig = {
    adoOrgUrl: 'https://dev.azure.com/your-org',
    adoProject: 'Mobily-BSS-Transform',
    adoAreaPath: 'Mobily-BSS-Transform\\Delivery',
    adoIterationPath: 'Mobily-BSS-Transform\\2025\\Q1',
  };

  // Apply default values if fields are empty
  Object.keys(defaultConfig).forEach((key) => {
    const element = document.getElementById(key);
    if (element && !element.value) {
      element.value = defaultConfig[key];
    }
  });

  console.log('ADO Integration initialized');
}

// Workflow Visualizer Functionality
function initializeWorkflowTabs() {
  console.log('=== INITIALIZING WORKFLOW TABS ===');

  // Use a longer timeout to ensure DOM is ready
  setTimeout(() => {
    // Clear any existing event listeners by cloning and replacing elements
    const tabButtonsContainer = document.querySelector('.top-tabs-section .tools-tabs');
    if (!tabButtonsContainer) {
      console.error('Tab buttons container not found!');
      return;
    }

    const tabButtons = document.querySelectorAll('.top-tabs-section .tools-tabs .tab-btn');

    // Ensure BOM and ADO contents are inside the main tab content area
    const tabToolsContentContainer = document.querySelector('.tab-content-area .tools-content');
    if (tabToolsContentContainer) {
      ['workflow-status', 'capabilities', 'inventory', 'estimates', 'ado-integration'].forEach(
        (tabId) => {
          const existingInPanel = tabToolsContentContainer.querySelector(`#${tabId}`);
          if (existingInPanel) return;

          // Try to find a source node for the tab. Prefer exact id, then legacy id fallback.
          let source = document.getElementById(tabId) || document.getElementById(`${tabId}-legacy`);
          // final fallback: any element whose id starts with the tabId (defensive)
          if (!source) source = document.querySelector(`[id^="${tabId}"]`);

          if (source && !source.closest('.tab-content-area')) {
            try {
              console.log(
                `Cloning tab content (found ${source.id}) into main tab panel as #${tabId}`,
              );
              // Rename original to avoid ID collisions, clone and append with the expected ID
              source.id = `${source.id}-old`;
              const clone = source.cloneNode(true);
              clone.id = tabId;
              tabToolsContentContainer.appendChild(clone);
              // Hide the original to avoid duplicate content showing elsewhere
              source.style.display = 'none';
            } catch (err) {
              console.error('Error cloning tab content', tabId, err);
            }
          } else if (!source) {
            console.warn(
              `No source found for tab '${tabId}' (tried '${tabId}', '${tabId}-legacy')`,
            );
          }
        },
      );

      // Also de-duplicate any default tabs that might still be present outside the panel
      [
        'workflow-status',
        'workflow-status-legacy',
        'dependencies',
        'dependencies-legacy',
        'milestones',
        'milestones-legacy',
        'risks',
        'integrations',
        'integrations-legacy',
        'inventory-legacy',
      ].forEach((tabId) => {
        const el = document.getElementById(tabId);
        if (el && !el.closest('.tab-content-area')) {
          console.log(`Hiding stray tab content #${tabId} outside tab panel`);
          el.id = `${tabId}-old`;
          el.style.display = 'none';
        }
      });

      // As a final safety net, hide any .tab-content not inside the main panel
      Array.from(document.querySelectorAll('.tab-content')).forEach((content) => {
        if (!content.closest('.tab-content-area')) {
          content.style.display = 'none';
          content.setAttribute('data-hidden-stray', 'true');
        }
      });

      // Hide the bottom workflow visualizer panel if present to avoid duplicate status display
      const bottomVisualizer = document.getElementById('workflow-visualizer-bottom');
      if (bottomVisualizer) {
        bottomVisualizer.style.display = 'none';
        bottomVisualizer.setAttribute('data-hidden-stray-visualizer', 'true');
      }

      // Explicitly hide any section showing the "Current Workflow Status" heading outside the tab panel
      Array.from(document.querySelectorAll('h3')).forEach((heading) => {
        const text = heading.textContent ? heading.textContent.trim() : '';
        if (text.includes('Current Workflow Status') && !heading.closest('.tab-content-area')) {
          const container =
            heading.closest('.tab-content') || heading.closest('section') || heading.parentElement;
          if (container) {
            console.log('Hiding stray Current Workflow Status section outside tab panel');
            container.style.display = 'none';
            container.setAttribute('data-hidden-stray-status', 'true');
          }
        }
      });
    } else {
      console.error('Main tab tools-content container not found.');
    }

    const tabContents = document.querySelectorAll('.tab-content-area .tools-content .tab-content');

    console.log('Found workflow tab buttons:', tabButtons.length);
    console.log('Found workflow tab contents:', tabContents.length);

    if (tabButtons.length === 0 || tabContents.length === 0) {
      console.error('No tab buttons or contents found!');
      return;
    }

    // Log all workflow tab buttons for debugging
    tabButtons.forEach((button, index) => {
      const tabId = button.getAttribute('data-tab');
      console.log(`Workflow Tab ${index}: ${tabId} - ${button.textContent.trim()}`);
    });

    // Log all workflow tab contents for debugging
    tabContents.forEach((content, index) => {
      console.log(`Workflow Content ${index}: ${content.id}`);
    });

    // Remove all existing event listeners and add fresh ones
    tabButtons.forEach((button) => {
      // Clone the button to remove all event listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
    });

    // Get the fresh buttons after cloning
    const freshTabButtons = document.querySelectorAll('.top-tabs-section .tools-tabs .tab-btn');

    // Add click handlers to fresh buttons
    freshTabButtons.forEach((button) => {
      button.addEventListener('click', function (e) {
        e.preventDefault();
        const targetTab = this.getAttribute('data-tab');
        console.log('=== CLICKED WORKFLOW TAB:', targetTab);

        // Remove active class from ALL tab buttons and contents
        freshTabButtons.forEach((btn) => {
          btn.classList.remove('active');
          btn.style.backgroundColor = '';
          btn.style.color = '';
        });

        tabContents.forEach((content) => {
          content.classList.remove('active');
          content.style.display = 'none';
        });

        // Add active class to clicked button
        this.classList.add('active');
        this.style.backgroundColor = '#3b82f6';
        this.style.color = 'white';

        // Show target content
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
          targetContent.style.display = 'block';
          console.log('✓ Successfully activated workflow tab:', targetTab);
        } else {
          console.error('✗ Target content not found for workflow tab:', targetTab);
          console.error(
            'Available content IDs:',
            Array.from(tabContents).map((c) => c.id),
          );
        }
      });
    });

    // Force initial state - show the first tab
    if (freshTabButtons.length > 0) {
      // Hide all content first
      tabContents.forEach((content) => {
        content.classList.remove('active');
        content.style.display = 'none';
      });

      // Remove active from all buttons
      freshTabButtons.forEach((btn) => {
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
        btn.style.color = '';
      });

      // Activate first tab
      const firstButton = freshTabButtons[0];
      const firstTabId = firstButton.getAttribute('data-tab');
      const firstContent = document.getElementById(firstTabId);

      firstButton.classList.add('active');
      firstButton.style.backgroundColor = '#3b82f6';
      firstButton.style.color = 'white';

      if (firstContent) {
        firstContent.classList.add('active');
        firstContent.style.display = 'block';
        console.log('✓ Set initial active tab:', firstTabId);
      }
    }

    console.log('=== WORKFLOW TABS INITIALIZATION COMPLETE ===');
  }, 500);
}

function initializeWorkflowControls() {
  const updateProgressBtn = document.getElementById('updateProgress');
  const resetWorkflowBtn = document.getElementById('resetWorkflow');

  if (updateProgressBtn) {
    updateProgressBtn.addEventListener('click', () => {
      updateWorkflowProgress();
    });
  }

  if (resetWorkflowBtn) {
    resetWorkflowBtn.addEventListener('click', () => {
      resetWorkflow();
    });
  }
}

function initializeWorkflowProgress() {
  const updateProjectStatusBtn = document.getElementById('updateProjectStatus');

  if (updateProjectStatusBtn) {
    updateProjectStatusBtn.addEventListener('click', () => {
      updateProjectStatus();
    });
  }
}

function updateWorkflowProgress() {
  // Simulate progress update
  const progressBars = document.querySelectorAll('.progress-fill');
  const progressValues = document.querySelectorAll('.summary-value');

  progressBars.forEach((bar, index) => {
    const currentWidth = parseInt(bar.style.width) || 0;
    const newWidth = Math.min(currentWidth + Math.random() * 20, 100);
    bar.style.width = newWidth + '%';

    if (progressValues[index]) {
      progressValues[index].textContent = Math.round(newWidth) + '%';
    }
  });

  // Show success message
  showNotification('Workflow progress updated successfully!', 'success');
}

function resetWorkflow() {
  if (
    confirm('Are you sure you want to reset the workflow progress? This action cannot be undone.')
  ) {
    const progressBars = document.querySelectorAll('.progress-fill');
    const progressValues = document.querySelectorAll('.summary-value');

    progressBars.forEach((bar, index) => {
      bar.style.width = '0%';
      if (progressValues[index]) {
        progressValues[index].textContent = '0%';
      }
    });

    // Reset phase statuses
    resetPhaseStatuses();

    showNotification('Workflow has been reset to initial state.', 'info');
  }
}

function resetPhaseStatuses() {
  const phases = document.querySelectorAll('.workflow-phase');
  phases.forEach((phase) => {
    const status = phase.querySelector('.phase-status');
    if (status) {
      status.className = 'phase-status pending';
      status.innerHTML = '<i class="fas fa-hourglass-start"></i><span>Pending</span>';
    }

    const steps = phase.querySelectorAll('.step');
    steps.forEach((step) => {
      step.className = 'step pending';
      const icon = step.querySelector('.step-icon');
      if (icon) {
        icon.innerHTML = '<i class="fas fa-circle"></i>';
      }
    });
  });
}

function updateProjectStatus() {
  // Simulate project status update
  const statusCards = document.querySelectorAll('.status-card');

  statusCards.forEach((card) => {
    const icon = card.querySelector('.status-icon');
    if (icon && icon.classList.contains('pending')) {
      // Simulate progress
      if (Math.random() > 0.5) {
        icon.className = 'status-icon in-progress';
        icon.innerHTML = '<i class="fas fa-clock"></i>';

        const content = card.querySelector('.status-content h4');
        if (content) {
          content.textContent = content.textContent.replace('Pending', 'In Progress');
        }
      }
    }
  });

  showNotification('Project status updated successfully!', 'success');
}

// Test function for debugging tabs
function testTabFunctionality() {
  console.log('=== TESTING TAB FUNCTIONALITY ===');

  // Test 1: Check if tab buttons exist
  const tabButtons = document.querySelectorAll('.top-tabs-section .tools-tabs .tab-btn');
  console.log('Tab buttons found:', tabButtons.length);
  tabButtons.forEach((btn, i) =>
    console.log(`  Button ${i}: ${btn.getAttribute('data-tab')} - ${btn.textContent.trim()}`),
  );

  // Test 2: Check if tab contents exist
  const tabContents = document.querySelectorAll('.tab-content-area .tools-content .tab-content');
  console.log('Tab contents found:', tabContents.length);
  tabContents.forEach((content, i) =>
    console.log(
      `  Content ${i}: ${content.id} - Active: ${content.classList.contains('active')} - Display: ${getComputedStyle(content).display}`,
    ),
  );

  // Test 3: Check each button-content mapping
  tabButtons.forEach((button, index) => {
    const tabId = button.getAttribute('data-tab');
    const content = document.getElementById(tabId);
    console.log(`Button ${index}: ${tabId} -> Content: ${content ? 'FOUND' : 'MISSING'}`);
    if (content) {
      console.log(
        `  Content display: ${getComputedStyle(content).display}, visibility: ${getComputedStyle(content).visibility}`,
      );
    }
  });

  // Test 4: Check current active state
  const activeButton = document.querySelector('.top-tabs-section .tools-tabs .tab-btn.active');
  const activeContent = document.querySelector(
    '.workflow-tools-panel .tools-content .tab-content.active',
  );
  console.log('Active button:', activeButton ? activeButton.getAttribute('data-tab') : 'NONE');
  console.log('Active content:', activeContent ? activeContent.id : 'NONE');

  // Test 5: Force activate the second tab manually
  if (tabButtons.length > 1) {
    console.log('=== MANUAL TAB ACTIVATION TEST ===');
    const secondButton = tabButtons[1];
    const secondTabId = secondButton.getAttribute('data-tab');
    console.log(`Attempting to activate: ${secondTabId}`);

    // Hide all content
    tabContents.forEach((content) => {
      content.classList.remove('active');
      content.style.display = 'none';
    });

    // Remove active from all buttons
    tabButtons.forEach((btn) => {
      btn.classList.remove('active');
      btn.style.backgroundColor = '';
      btn.style.color = '';
    });

    // Activate second button and content
    secondButton.classList.add('active');
    secondButton.style.backgroundColor = '#3b82f6';
    secondButton.style.color = 'white';

    const targetContent = document.getElementById(secondTabId);
    if (targetContent) {
      targetContent.classList.add('active');
      targetContent.style.display = 'block';
      console.log(`✓ Successfully activated: ${secondTabId}`);
      console.log(`  Display: ${getComputedStyle(targetContent).display}`);
    } else {
      console.error(`✗ Failed to activate: ${secondTabId}`);
    }
  }

  console.log('=== TAB FUNCTIONALITY TEST COMPLETE ===');
}

// Make test function globally available
window.testTabFunctionality = testTabFunctionality;
