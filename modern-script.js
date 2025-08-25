// Modern UI Script - Three-pane Master–Canvas–Inspector Pattern

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the modern application
    initializeModernApp();
});

function initializeModernApp() {
    // Set up tab switching
    setupModernTabs();
    
    // Set up domain filtering
    setupDomainFiltering();
    
    // Set up search functionality
    setupSearchFunctionality();
    
    // Set up capability selection
    setupCapabilitySelection();
    
    // Set up canvas interactions
    setupCanvasInteractions();
    
    // Set up inspector functionality
    setupInspectorFunctionality();
    
    // Set up UI toggle
    setupUIToggle();
    
    // Set up BOM functionality
    setupBOMFunctionality();
    
    // Load initial data
    loadInitialData();
}

// Modern Tab Management
function setupModernTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log('Setting up modern tabs...');
    console.log('Found tab buttons:', tabButtons.length);
    console.log('Found tab contents:', tabContents.length);
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            console.log('Clicked modern tab:', targetTab);
            
            // Remove active class from all tabs and buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
                console.log('Successfully activated modern tab:', targetTab);
            } else {
                console.error('Target content not found for modern tab:', targetTab);
            }
        });
    });
}

// Domain Filtering
function setupDomainFiltering() {
    const filterChips = document.querySelectorAll('.filter-chips .chip');
    const capabilityGroups = document.querySelectorAll('.capability-group');
    
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const domain = chip.getAttribute('data-domain');
            
            // Update active chip
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            // Filter capability groups
            capabilityGroups.forEach(group => {
                if (domain === 'all' || group.getAttribute('data-domain') === domain) {
                    group.style.display = 'block';
                } else {
                    group.style.display = 'none';
                }
            });
            
            console.log('Filtered by domain:', domain);
        });
    });
}

// Search Functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('capabilitySearch');
    const capabilityCards = document.querySelectorAll('.capability-card');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            capabilityCards.forEach(card => {
                const capabilityName = card.querySelector('label').textContent.toLowerCase();
                const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
                
                const matches = capabilityName.includes(searchTerm) || 
                               tags.some(tag => tag.includes(searchTerm));
                
                card.style.display = matches ? 'block' : 'none';
            });
            
            console.log('Searching for:', searchTerm);
        });
    }
}

// Capability Selection
function setupCapabilitySelection() {
    const capabilityCards = document.querySelectorAll('.capability-card');
    const groupHeaders = document.querySelectorAll('.group-header');
    
    // Handle capability card selection
    capabilityCards.forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        
        checkbox.addEventListener('change', () => {
            updateGroupCounts();
            updateCanvasStatus();
            
            if (checkbox.checked) {
                card.style.borderColor = 'var(--primary-500)';
                card.style.backgroundColor = 'var(--primary-50)';
            } else {
                card.style.borderColor = 'var(--gray-200)';
                card.style.backgroundColor = 'white';
            }
        });
        
        // Make entire card clickable
        card.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });
    
    // Update group counts
    function updateGroupCounts() {
        groupHeaders.forEach(header => {
            const group = header.closest('.capability-group');
            const checkboxes = group.querySelectorAll('input[type="checkbox"]:checked');
            const countSpan = header.querySelector('.count');
            
            if (countSpan) {
                countSpan.textContent = `${checkboxes.length} selected`;
            }
        });
    }
}

// Canvas Interactions
function setupCanvasInteractions() {
    const canvasArea = document.querySelector('.canvas-area');
    const canvasGrid = document.querySelector('.canvas-grid');
    const toolbarButtons = document.querySelectorAll('.btn-toolbar');
    const capabilityCards = document.querySelectorAll('.capability-card');
    
    let canvasMode = 'select';
    let canvasView = 'business';
    
    // Toolbar mode switching
    toolbarButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.getAttribute('data-mode');
            const view = button.getAttribute('data-view');
            
            if (mode) {
                // Update mode
                document.querySelectorAll('[data-mode]').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                canvasMode = mode;
                console.log('Canvas mode changed to:', mode);
            }
            
            if (view) {
                // Update view
                document.querySelectorAll('[data-view]').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                canvasView = view;
                console.log('Canvas view changed to:', view);
            }
        });
    });
    
    // Make capability cards draggable
    capabilityCards.forEach(card => {
        card.setAttribute('draggable', true);
        
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
            card.style.opacity = '0.5';
        });
        
        card.addEventListener('dragend', () => {
            card.style.opacity = '1';
        });
    });
    
    // Make canvas a drop zone
    if (canvasGrid) {
        canvasGrid.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvasGrid.style.borderColor = 'var(--primary-500)';
            canvasGrid.style.backgroundColor = 'var(--primary-50)';
        });
        
        canvasGrid.addEventListener('dragleave', () => {
            canvasGrid.style.borderColor = 'var(--gray-300)';
            canvasGrid.style.backgroundColor = 'white';
        });
        
        canvasGrid.addEventListener('drop', (e) => {
            e.preventDefault();
            const capabilityId = e.dataTransfer.getData('text/plain');
            
            canvasGrid.style.borderColor = 'var(--gray-300)';
            canvasGrid.style.backgroundColor = 'white';
            
            // Add capability to canvas
            addCapabilityToCanvas(capabilityId, e.clientX, e.clientY);
        });
    }
}

// Add capability to canvas
function addCapabilityToCanvas(capabilityId, x, y) {
    const canvasGrid = document.querySelector('.canvas-grid');
    const capabilityCard = document.querySelector(`[data-id="${capabilityId}"]`);
    
    if (capabilityCard && canvasGrid) {
        // Remove placeholder if it exists
        const placeholder = canvasGrid.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Create canvas node
        const canvasNode = document.createElement('div');
        canvasNode.className = 'canvas-node';
        canvasNode.innerHTML = `
            <div class="node-header">
                <span class="node-title">${capabilityCard.querySelector('label').textContent}</span>
                <button class="node-remove" onclick="removeCanvasNode(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="node-tags">
                ${capabilityCard.querySelector('.card-tags').innerHTML}
            </div>
        `;
        
        // Position node
        const rect = canvasGrid.getBoundingClientRect();
        const relativeX = x - rect.left;
        const relativeY = y - rect.top;
        
        canvasNode.style.position = 'absolute';
        canvasNode.style.left = `${relativeX}px`;
        canvasNode.style.top = `${relativeY}px`;
        canvasNode.style.zIndex = '10';
        
        canvasGrid.appendChild(canvasNode);
        
        updateCanvasStatus();
        console.log('Added capability to canvas:', capabilityId);
    }
}

// Remove canvas node
function removeCanvasNode(button) {
    const node = button.closest('.canvas-node');
    if (node) {
        node.remove();
        updateCanvasStatus();
        
        // Show placeholder if no nodes
        const canvasGrid = document.querySelector('.canvas-grid');
        const nodes = canvasGrid.querySelectorAll('.canvas-node');
        
        if (nodes.length === 0) {
            canvasGrid.innerHTML = `
                <div class="canvas-placeholder">
                    <i class="fas fa-mouse-pointer"></i>
                    <p>Drag capabilities from the catalog to build your architecture</p>
                    <p class="hint">Use the toolbar to switch between business, technical, and integration views</p>
                </div>
            `;
        }
    }
}

// Update canvas status
function updateCanvasStatus() {
    const canvasGrid = document.querySelector('.canvas-grid');
    const nodes = canvasGrid ? canvasGrid.querySelectorAll('.canvas-node') : [];
    const selectedCapabilities = document.querySelectorAll('.capability-card input[type="checkbox"]:checked');
    
    const statusItems = document.querySelectorAll('.status-item');
    
    statusItems.forEach(item => {
        const text = item.querySelector('span:last-child');
        if (text) {
            if (item.textContent.includes('nodes')) {
                text.textContent = `${nodes.length} nodes`;
            } else if (item.textContent.includes('connections')) {
                text.textContent = '0 connections';
            } else if (item.textContent.includes('issues')) {
                text.textContent = '0 issues';
            }
        }
    });
}

// Inspector Functionality
function setupInspectorFunctionality() {
    // Add dependency functionality
    const addDependencyBtn = document.querySelector('#dependencies .btn-small');
    if (addDependencyBtn) {
        addDependencyBtn.addEventListener('click', () => {
            addNewDependency();
        });
    }
    
    // Add integration functionality
    const addIntegrationBtn = document.querySelector('#integrations .btn-small');
    if (addIntegrationBtn) {
        addIntegrationBtn.addEventListener('click', () => {
            addNewIntegration();
        });
    }
    
    // BOM generation
    const generateBOMBtn = document.getElementById('generateBOM');
    if (generateBOMBtn) {
        generateBOMBtn.addEventListener('click', () => {
            generateBOM();
        });
    }
    
    // BOM export
    const exportBOMBtn = document.getElementById('exportBOM');
    if (exportBOMBtn) {
        exportBOMBtn.addEventListener('click', () => {
            exportBOM();
        });
    }
}

// Add new dependency
function addNewDependency() {
    const dependencyList = document.querySelector('.dependency-list');
    const newDependency = document.createElement('div');
    newDependency.className = 'dependency-item';
    newDependency.innerHTML = `
        <div class="dependency-icon">
            <i class="fas fa-plus"></i>
        </div>
        <div class="dependency-info">
            <span class="dependency-name">New Dependency</span>
            <span class="dependency-type">System</span>
        </div>
        <div class="dependency-status pending">Pending</div>
        <div class="dependency-owner">Unassigned</div>
    `;
    
    dependencyList.appendChild(newDependency);
    console.log('Added new dependency');
}

// Add new integration
function addNewIntegration() {
    const integrationList = document.querySelector('.integration-list');
    const newIntegration = document.createElement('div');
    newIntegration.className = 'integration-item';
    newIntegration.innerHTML = `
        <div class="integration-icon">
            <i class="fas fa-plus"></i>
        </div>
        <div class="integration-info">
            <span class="integration-name">New Integration</span>
            <span class="integration-type">REST</span>
        </div>
        <div class="integration-status pending">Pending</div>
        <button class="btn-small">Design</button>
    `;
    
    integrationList.appendChild(newIntegration);
    console.log('Added new integration');
}

// BOM Functionality
function setupBOMFunctionality() {
    // Add service functionality
    const addServiceBtn = document.querySelector('#inventory .section-header .btn-small');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => {
            addNewService();
        });
    }
    
    // Add resource functionality
    const addResourceBtn = document.querySelector('#inventory .section-header:last-child .btn-small');
    if (addResourceBtn) {
        addResourceBtn.addEventListener('click', () => {
            addNewResource();
        });
    }
}

// Add new service
function addNewService() {
    const serviceSpecs = document.querySelector('.service-specs');
    const newService = document.createElement('div');
    newService.className = 'service-spec-item';
    newService.setAttribute('data-type', 'rfs');
    newService.innerHTML = `
        <div class="service-header">
            <span class="service-type rfs">RFS</span>
            <span class="service-name">New Service</span>
        </div>
        <div class="service-details">
            <span class="service-phase">Design</span>
            <span class="service-effort">0 PD</span>
            <span class="service-cost">$0</span>
        </div>
    `;
    
    // Add to first service category
    const firstCategory = serviceSpecs.querySelector('.service-category');
    if (firstCategory) {
        firstCategory.appendChild(newService);
    }
    
    updateBOMSummary();
    console.log('Added new service');
}

// Add new resource
function addNewResource() {
    const resourceSpecs = document.querySelector('.resource-specs');
    const newResource = document.createElement('div');
    newResource.className = 'resource-spec-item';
    newResource.setAttribute('data-type', 'skills');
    newResource.innerHTML = `
        <div class="resource-header">
            <span class="resource-type skills">Skills</span>
            <span class="resource-name">New Resource</span>
        </div>
        <div class="resource-details">
            <span class="resource-rate">$0/day</span>
            <span class="resource-availability">Available</span>
        </div>
    `;
    
    // Add to first resource category
    const firstCategory = resourceSpecs.querySelector('.resource-category');
    if (firstCategory) {
        firstCategory.appendChild(newResource);
    }
    
    updateBOMSummary();
    console.log('Added new resource');
}

// Generate BOM
function generateBOM() {
    console.log('Generating BOM...');
    
    // Simulate BOM generation
    setTimeout(() => {
        alert('BOM generated successfully!');
        updateBOMSummary();
    }, 1000);
}

// Export BOM
function exportBOM() {
    console.log('Exporting BOM...');
    
    // Simulate BOM export
    setTimeout(() => {
        alert('BOM exported successfully!');
    }, 1000);
}

// Update BOM Summary
function updateBOMSummary() {
    const services = document.querySelectorAll('.service-spec-item');
    const resources = document.querySelectorAll('.resource-spec-item');
    
    let totalEffort = 0;
    let totalCost = 0;
    
    // Calculate totals
    services.forEach(service => {
        const effortText = service.querySelector('.service-effort').textContent;
        const costText = service.querySelector('.service-cost').textContent;
        
        const effort = parseInt(effortText.replace(' PD', '')) || 0;
        const cost = parseInt(costText.replace(/[$,]/g, '')) || 0;
        
        totalEffort += effort;
        totalCost += cost;
    });
    
    // Update summary
    const summaryItems = document.querySelectorAll('.summary-item');
    summaryItems.forEach(item => {
        const label = item.querySelector('.summary-label').textContent;
        const value = item.querySelector('.summary-value');
        
        if (label.includes('Services')) {
            value.textContent = services.length;
        } else if (label.includes('Resources')) {
            value.textContent = resources.length;
        } else if (label.includes('Effort')) {
            value.textContent = `${totalEffort} PD`;
        } else if (label.includes('Cost')) {
            value.textContent = `$${totalCost.toLocaleString()}`;
        }
    });
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

// Load Initial Data
function loadInitialData() {
    console.log('Loading initial data for modern UI...');
    
    // Update initial counts
    updateGroupCounts();
    updateCanvasStatus();
    updateBOMSummary();
    
    // Set up any additional initializations
    setupKeyboardShortcuts();
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            console.log('Save triggered');
            // Add save functionality here
        }
        
        // Ctrl/Cmd + N to add new capability
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            console.log('Add new capability triggered');
            // Add new capability functionality here
        }
        
        // Escape to clear selection
        if (e.key === 'Escape') {
            console.log('Clear selection triggered');
            // Clear any selections here
        }
    });
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = 'var(--success-500)';
            break;
        case 'error':
            notification.style.backgroundColor = 'var(--error-500)';
            break;
        case 'warning':
            notification.style.backgroundColor = 'var(--warning-500)';
            break;
        default:
            notification.style.backgroundColor = 'var(--primary-500)';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
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
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .canvas-node {
        background: white;
        border: 2px solid var(--primary-300);
        border-radius: var(--radius-lg);
        padding: var(--spacing-3) var(--spacing-4);
        min-width: 200px;
        box-shadow: var(--shadow-md);
        cursor: move;
        transition: var(--transition-fast);
    }
    
    .canvas-node:hover {
        border-color: var(--primary-500);
        box-shadow: var(--shadow-lg);
    }
    
    .node-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-2);
    }
    
    .node-title {
        font-weight: 600;
        color: var(--gray-900);
        font-size: var(--font-size-sm);
    }
    
    .node-remove {
        background: none;
        border: none;
        color: var(--gray-400);
        cursor: pointer;
        padding: var(--spacing-1);
        border-radius: var(--radius-sm);
        transition: var(--transition-fast);
    }
    
    .node-remove:hover {
        background: var(--error-50);
        color: var(--error-500);
    }
    
    .node-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-1);
    }
    
    .node-tags .tag {
        font-size: var(--font-size-xs);
        padding: var(--spacing-1) var(--spacing-2);
    }
`;
document.head.appendChild(style);

console.log('Modern UI script loaded successfully');
