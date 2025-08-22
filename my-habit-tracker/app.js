// Mobile-Optimized Minimalist Habit Tracker - IndexedDB Persistence + Export/Import + Dark Mode

const DAYS_IN_HEATMAP = 56; // 8 weeks
const DB_NAME = 'habitkit-db';
const DB_STORE = 'habits';

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 ('ontouchstart' in window) || 
                 (navigator.maxTouchPoints > 0);

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('habit-tracker-theme');
  const themeToggle = document.getElementById('theme-toggle');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeToggle) themeToggle.checked = true;
  } else {
    document.body.classList.remove('dark-mode');
    if (themeToggle) themeToggle.checked = false;
  }
}

function toggleTheme() {
  console.log('toggleTheme function called');
  const themeToggle = document.getElementById('theme-toggle');
  const isDark = themeToggle.checked;
  console.log('Toggle checked state:', isDark);
  
  if (isDark) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('habit-tracker-theme', 'dark');
    console.log('Switched to dark mode');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('habit-tracker-theme', 'light');
    console.log('Switched to light mode');
  }
}

function updateThemeIcon(icon) {
  // This function is no longer needed with the new toggle design
  // The icons are now handled by CSS
}

// Mobile-specific utilities
function addTouchFeedback(element) {
  if (!isMobile) return;
  
  element.addEventListener('touchstart', function() {
    this.style.transform = 'scale(0.98)';
  }, { passive: true });
  
  element.addEventListener('touchend', function() {
    this.style.transform = '';
  }, { passive: true });
}

function preventZoomOnInput() {
  if (!isMobile) return;
  
  const inputs = document.querySelectorAll('input[type="text"]');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      // Prevent zoom on iOS
      this.style.fontSize = '16px';
    });
    
    input.addEventListener('blur', function() {
      this.style.fontSize = '';
    });
  });
}

// Minimal idb helper
const idb = {
  async withStore(mode, callback) {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, 1);
      open.onupgradeneeded = () => {
        open.result.createObjectStore(DB_STORE, { keyPath: 'id' });
      };
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction(DB_STORE, mode);
        const store = tx.objectStore(DB_STORE);
        callback(store, tx);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
  },
  async getAll() {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, 1);
      open.onupgradeneeded = () => {
        open.result.createObjectStore(DB_STORE, { keyPath: 'id' });
      };
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      };
    });
  },
  async put(habit) {
    return this.withStore('readwrite', (store) => store.put(habit));
  },
  async delete(id) {
    return this.withStore('readwrite', (store) => store.delete(id));
  },
  async clear() {
    return this.withStore('readwrite', (store) => store.clear());
  }
};

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function createHabit({ name, color, icon }) {
  return {
    id: Date.now() + Math.random().toString(36).slice(2),
    name,
    color,
    icon,
    completions: {}, // { 'YYYY-MM-DD': true }
  };
}

function renderHabits(habits) {
  const app = document.getElementById('app');
  // Remove all cards except the form and export/import controls
  app.querySelectorAll('.habit-card').forEach(card => card.remove());

  habits.forEach(habit => {
    const card = document.createElement('section');
    card.className = 'habit-card';
    card.style.setProperty('--habit-color', habit.color);

    // Header
    const header = document.createElement('div');
    header.className = 'habit-header';
    if (habit.icon) {
      const icon = document.createElement('span');
      icon.className = 'habit-icon';
      icon.textContent = habit.icon;
      header.appendChild(icon);
    }
    const name = document.createElement('span');
    name.textContent = habit.name;
    header.appendChild(name);
    card.appendChild(header);

    // Action button
    const action = document.createElement('div');
    action.className = 'habit-action';
    const today = getTodayISO();
    const completedToday = !!habit.completions[today];
    const btn = document.createElement('button');
    btn.textContent = completedToday ? 'Completed' : 'Mark Today';
    btn.className = completedToday ? 'completed' : '';
    btn.onclick = async () => {
      habit.completions[today] = !completedToday;
      await idb.put(habit);
      renderHabits(habits);
    };
    
    // Add touch feedback for mobile
    addTouchFeedback(btn);
    
    action.appendChild(btn);
    card.appendChild(action);

    // View toggle
    const viewToggle = document.createElement('div');
    viewToggle.className = 'view-toggle';
    viewToggle.innerHTML = `
      <button class="view-btn active" data-view="heatmap">Heatmap</button>
      <button class="view-btn" data-view="calendar">Calendar</button>
    `;
    card.appendChild(viewToggle);

    // Heatmap with clickable cells
    const heatmap = document.createElement('div');
    heatmap.className = 'heatmap view-container active';
    const days = [];
    const now = new Date();
    for (let i = DAYS_IN_HEATMAP - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    
    days.forEach(dateStr => {
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell' + (habit.completions[dateStr] ? ' completed' : '');
      cell.setAttribute('data-date', dateStr);
      cell.setAttribute('data-habit-id', habit.id);
      
      // Add click handler for marking/unmarking
      cell.addEventListener('click', async () => {
        const isCompleted = !!habit.completions[dateStr];
        habit.completions[dateStr] = !isCompleted;
        await idb.put(habit);
        renderHabits(habits);
      });
      
      // Add tooltip for mobile (long press)
      if (isMobile) {
        cell.setAttribute('data-completed', habit.completions[dateStr] ? 'true' : 'false');
        
        // Add long press handler for mobile
        let longPressTimer;
        cell.addEventListener('touchstart', () => {
          longPressTimer = setTimeout(() => {
            showDateTooltip(cell, dateStr, habit.completions[dateStr]);
          }, 500);
        }, { passive: true });
        
        cell.addEventListener('touchend', () => {
          clearTimeout(longPressTimer);
        }, { passive: true });
      }
      
      // Add hover tooltip for desktop
      if (!isMobile) {
        cell.addEventListener('mouseenter', () => {
          showDateTooltip(cell, dateStr, habit.completions[dateStr]);
        });
        
        cell.addEventListener('mouseleave', () => {
          hideDateTooltip();
        });
      }
      
      heatmap.appendChild(cell);
    });
    card.appendChild(heatmap);

    // Calendar view
    const calendar = document.createElement('div');
    calendar.className = 'calendar view-container';
    calendar.appendChild(createCalendarView(habit));
    card.appendChild(calendar);

    // View toggle functionality
    const viewBtns = viewToggle.querySelectorAll('.view-btn');
    const viewContainers = card.querySelectorAll('.view-container');
    
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        
        // Update button states
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update container visibility
        viewContainers.forEach(container => {
          container.classList.remove('active');
          if (container.classList.contains(view)) {
            container.classList.add('active');
          }
        });
      });
    });

    app.appendChild(card);
  });
}

// Tooltip functions for date display
function showDateTooltip(element, dateStr, isCompleted) {
  const date = new Date(dateStr);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  const tooltip = document.createElement('div');
  tooltip.className = 'date-tooltip';
  tooltip.textContent = `${formattedDate} - ${isCompleted ? 'Completed' : 'Not completed'}`;
  tooltip.style.position = 'absolute';
  tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '0.5rem';
  tooltip.style.borderRadius = '0.5rem';
  tooltip.style.fontSize = '0.875rem';
  tooltip.style.zIndex = '1000';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.whiteSpace = 'nowrap';
  
  document.body.appendChild(tooltip);
  
  // Position tooltip
  const rect = element.getBoundingClientRect();
  tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
  tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
  
  // Store reference for removal
  element._tooltip = tooltip;
}

function hideDateTooltip() {
  const tooltips = document.querySelectorAll('.date-tooltip');
  tooltips.forEach(tooltip => tooltip.remove());
}

// Calendar view creation
function createCalendarView(habit) {
  const calendarContainer = document.createElement('div');
  calendarContainer.className = 'calendar-container';
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Create month header
  const monthHeader = document.createElement('div');
  monthHeader.className = 'calendar-header';
  monthHeader.innerHTML = `
    <button class="month-nav" data-direction="prev">‹</button>
    <span class="month-title">${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
    <button class="month-nav" data-direction="next">›</button>
  `;
  calendarContainer.appendChild(monthHeader);
  
  // Create weekday headers
  const weekdayHeader = document.createElement('div');
  weekdayHeader.className = 'calendar-weekdays';
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  weekdays.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'weekday-header';
    dayHeader.textContent = day;
    weekdayHeader.appendChild(dayHeader);
  });
  calendarContainer.appendChild(weekdayHeader);
  
  // Create calendar grid
  const calendarGrid = document.createElement('div');
  calendarGrid.className = 'calendar-grid';
  
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    
    const dateStr = date.toISOString().slice(0, 10);
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = dateStr === getTodayISO();
    const isCompleted = !!habit.completions[dateStr];
    
    if (!isCurrentMonth) {
      dayCell.classList.add('other-month');
    }
    if (isToday) {
      dayCell.classList.add('today');
    }
    if (isCompleted) {
      dayCell.classList.add('completed');
    }
    
    dayCell.textContent = date.getDate();
    dayCell.setAttribute('data-date', dateStr);
    dayCell.setAttribute('data-habit-id', habit.id);
    
    // Add click handler
    dayCell.addEventListener('click', async () => {
      if (isCurrentMonth) {
        const wasCompleted = !!habit.completions[dateStr];
        habit.completions[dateStr] = !wasCompleted;
        await idb.put(habit);
        renderHabits(habits);
      }
    });
    
    // Add touch feedback for mobile
    addTouchFeedback(dayCell);
    
    calendarGrid.appendChild(dayCell);
  }
  
  calendarContainer.appendChild(calendarGrid);
  return calendarContainer;
}

function renderExportImportControls(habits, onImport) {
  let controls = document.getElementById('export-import-controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'export-import-controls';
    controls.style.display = 'flex';
    controls.style.gap = '0.8rem';
    controls.style.marginBottom = '1rem';
    controls.style.flexDirection = 'column';
    const app = document.getElementById('app');
    app.insertBefore(controls, app.querySelector('.habit-form').nextSibling);
  }
  controls.innerHTML = '';

  // Export button
  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.textContent = 'Export Data';
  exportBtn.onclick = () => {
    const data = JSON.stringify(habits, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habitkit-backup.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };
  
  // Add touch feedback for mobile
  addTouchFeedback(exportBtn);
  controls.appendChild(exportBtn);

  // Import button
  const importLabel = document.createElement('label');
  importLabel.textContent = 'Import Data';
  importLabel.style.cursor = 'pointer';
  importLabel.style.display = 'flex';
  importLabel.style.alignItems = 'center';
  importLabel.style.justifyContent = 'center';
  importLabel.style.padding = '0.8rem 1.2rem';
  importLabel.style.background = '#ff8c00';
  importLabel.style.color = 'white';
  importLabel.style.borderRadius = '0.8rem';
  importLabel.style.fontWeight = '600';
  importLabel.style.minHeight = '44px';
  importLabel.style.touchAction = 'manipulation';

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json,application/json';
  importInput.style.display = 'none';
  importInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      await idb.clear();
      for (const habit of imported) {
        await idb.put(habit);
      }
      onImport(await idb.getAll());
      alert('Data imported successfully!');
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };
  importLabel.appendChild(importInput);
  
  // Add touch feedback for mobile
  addTouchFeedback(importLabel);
  controls.appendChild(importLabel);
}

// Mobile-specific event handlers
function setupMobileHandlers() {
  if (!isMobile) return;
  
  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
  
  // Add haptic feedback for iOS
  if (navigator.vibrate) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        navigator.vibrate(10);
      });
    });
  }
  
  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      // Recalculate layout after orientation change
      window.scrollTo(0, 0);
    }, 100);
  });
  
  // Prevent pull-to-refresh on mobile
  let startY = 0;
  document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].pageY;
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    const y = e.touches[0].pageY;
    const pull = y - startY;
    
    if (document.scrollTop === 0 && pull > 0) {
      e.preventDefault();
    }
  }, { passive: false });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize theme
  initTheme();
  
  // Set up theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  console.log('Theme toggle button found:', themeToggle);
  
  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      console.log('Theme toggle changed!');
      toggleTheme();
    });
    console.log('Theme toggle event listener attached');
  } else {
    console.error('Theme toggle button not found!');
  }

  // Setup mobile-specific handlers
  setupMobileHandlers();
  preventZoomOnInput();

  const app = document.getElementById('app');
  const form = app.querySelector('form.habit-form');
  let habits = await idb.getAll();

  // Add habit
  form.onsubmit = async e => {
    e.preventDefault();
    const name = form.habitName.value.trim();
    const color = form.habitColor.value;
    if (!name) return;
    const habit = createHabit({ name, color, icon: '' });
    habits.push(habit);
    await idb.put(habit);
    form.reset();
    renderHabits(habits);
    renderExportImportControls(habits, newHabits => {
      habits = newHabits;
      renderHabits(habits);
    });
  };

  renderHabits(habits);
  renderExportImportControls(habits, newHabits => {
    habits = newHabits;
    renderHabits(habits);
  });
}); 