// HabitKit - GitHub-Style Habit Tracker with Contribution Heatmaps
// Following GitHub's exact schema: 52 weeks × 7 weekdays

class HabitKit {
  constructor() {
    this.habits = [];
    this.currentView = 'dashboard'; // 'dashboard' or 'detail'
    this.selectedHabit = null;
    this.isDarkMode = true;
    
    this.init();
  }

  init() {
    this.loadHabits();
    this.setupEventListeners();
    this.render();
  }

  // GitHub-style heatmap utilities
  getWeekNumber(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  }

  getDayOfWeek(date) {
    // GitHub uses Monday = 0, Sunday = 6
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  getDateFromWeekAndDay(week, dayOfWeek, year) {
    const start = new Date(year, 0, 1);
    const firstMonday = new Date(start);
    const dayOffset = start.getDay();
    const mondayOffset = dayOffset === 0 ? 6 : dayOffset - 1;
    
    firstMonday.setDate(start.getDate() - mondayOffset);
    const targetDate = new Date(firstMonday);
    targetDate.setDate(firstMonday.getDate() + (week * 7) + dayOfWeek);
    
    return targetDate;
  }

  getCompletionLevel(habit, date) {
    const dateStr = date.toISOString().slice(0, 10);
    const completed = habit.completions[dateStr];
    
    if (!completed) return 0;
    
    // Calculate intensity based on surrounding days (like GitHub)
    let intensity = 1;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekStart);
      checkDate.setDate(weekStart.getDate() + i);
      const checkStr = checkDate.toISOString().slice(0, 10);
      if (habit.completions[checkStr]) intensity++;
    }
    
    return Math.min(intensity, 4); // 0-4 levels like GitHub
  }

  // Data management
  loadHabits() {
    const saved = localStorage.getItem('habitkit-habits');
    if (saved) {
      this.habits = JSON.parse(saved);
    } else {
      // Default habits with GitHub-style colors
      this.habits = [
        {
          id: 1,
          name: 'Walk around the block',
          description: 'Go for a short walk to clear the mind',
          color: '#39d353', // GitHub green
          theme: 'green',
          completions: {}
        },
        {
          id: 2,
          name: 'Learn Norwegian',
          description: 'Practice Norwegian language skills',
          color: '#a371f7', // GitHub purple
          theme: 'purple',
          completions: {}
        },
        {
          id: 3,
          name: 'Eat a piece of fruit',
          description: 'Consume one serving of fruit',
          color: '#f85149', // GitHub red
          theme: 'red',
          completions: {}
        },
        {
          id: 4,
          name: 'Stretch for 5 minutes',
          description: 'Do basic stretching exercises',
          color: '#ffa657', // GitHub orange
          theme: 'orange',
          completions: {}
        },
        {
          id: 5,
          name: 'Deep breathing exercise',
          description: 'Practice mindful breathing',
          color: '#58a6ff', // GitHub blue
          theme: 'blue',
          completions: {}
        }
      ];
      this.saveHabits();
    }
  }

  saveHabits() {
    localStorage.setItem('habitkit-habits', JSON.stringify(this.habits));
  }

  toggleHabitCompletion(habitId, date) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return;

    const dateStr = date.toISOString().slice(0, 10);
    if (habit.completions[dateStr]) {
      delete habit.completions[dateStr];
    } else {
      habit.completions[dateStr] = true;
    }
    
    this.saveHabits();
    this.render();
  }

  addHabit(name, description, theme) {
    const themes = {
      green: '#39d353',
      purple: '#a371f7',
      red: '#f85149',
      orange: '#ffa657',
      blue: '#58a6ff'
    };

    const habit = {
      id: Date.now(),
      name,
      description,
      color: themes[theme] || themes.green,
      theme,
      completions: {}
    };

    this.habits.push(habit);
    this.saveHabits();
    this.render();
  }

  // GitHub-style heatmap rendering
  renderHeatmap(habit, isLarge = false) {
    const container = document.createElement('div');
    container.className = 'heatmap-container';
    
    // Header with title and legend
    const header = document.createElement('div');
    header.className = 'heatmap-header';
    
    const title = document.createElement('div');
    title.className = 'heatmap-title';
    title.textContent = isLarge ? 'One year of activity' : 'Activity';
    
    const legend = document.createElement('div');
    legend.className = 'heatmap-legend';
    
    const legendTexts = ['Less', 'More'];
    const legendColors = ['#21262d', '#39d353'];
    
    legendTexts.forEach((text, i) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      
      const color = document.createElement('div');
      color.className = 'legend-color';
      color.style.background = legendColors[i];
      
      const label = document.createElement('span');
      label.textContent = text;
      
      item.appendChild(color);
      item.appendChild(label);
      legend.appendChild(item);
    });
    
    header.appendChild(title);
    header.appendChild(legend);
    container.appendChild(header);
    
    // Month labels (X-axis)
    const monthLabels = document.createElement('div');
    monthLabels.className = 'month-labels';
    monthLabels.style.cssText = `
      display: grid;
      grid-template-columns: repeat(53, 1fr);
      gap: 3px;
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--text-secondary);
    `;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthPositions = [0, 4, 8, 13, 17, 22, 26, 30, 35, 39, 43, 47];
    
    monthPositions.forEach((pos, i) => {
      const monthLabel = document.createElement('div');
      monthLabel.textContent = months[i];
      monthLabel.style.gridColumn = `${pos + 1} / span 4`;
      monthLabel.style.textAlign = 'center';
      monthLabels.appendChild(monthLabel);
    });
    
    container.appendChild(monthLabels);
    
    // Main heatmap grid
    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(53, 1fr);
      grid-template-rows: repeat(7, 1fr);
      gap: 3px;
      padding: 8px;
      background: var(--bg-tertiary);
      border-radius: 6px;
      overflow-x: auto;
    `;
    
    // Generate 53 weeks × 7 days grid
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    
    // Find the first Monday of the year
    const firstMonday = new Date(startDate);
    const dayOffset = startDate.getDay();
    const mondayOffset = dayOffset === 0 ? 6 : dayOffset - 1;
    firstMonday.setDate(startDate.getDate() - mondayOffset);
    
    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        
        const cellDate = new Date(firstMonday);
        cellDate.setDate(firstMonday.getDate() + (week * 7) + day);
        
        // Skip if date is in the future
        if (cellDate > new Date()) {
          cell.style.visibility = 'hidden';
        } else {
          const completionLevel = this.getCompletionLevel(habit, cellDate);
          const cellSize = isLarge ? '16px' : '12px';
          
          cell.style.cssText = `
            width: ${cellSize};
            height: ${cellSize};
            border-radius: 2px;
            background: ${this.getHeatmapColor(completionLevel, habit.color)};
            transition: all 0.15s ease;
            cursor: pointer;
            position: relative;
          `;
          
          // Add click handler
          cell.addEventListener('click', () => {
            this.toggleHabitCompletion(habit.id, cellDate);
          });
          
          // Add tooltip
          const dateStr = cellDate.toISOString().slice(0, 10);
          const isCompleted = !!habit.completions[dateStr];
          
          cell.addEventListener('mouseenter', (e) => {
            this.showTooltip(e.target, cellDate, isCompleted, habit);
          });
          
          cell.addEventListener('mouseleave', () => {
            this.hideTooltip();
          });
        }
        
        grid.appendChild(cell);
      }
    }
    
    container.appendChild(grid);
    return container;
  }

  getHeatmapColor(level, habitColor) {
    if (level === 0) return 'var(--heatmap-empty)';
    
    // GitHub-style color progression
    const colors = {
      green: ['#0e4429', '#006d32', '#26a641', '#39d353'],
      purple: ['#1a103d', '#4c2889', '#7c3aed', '#a371f7'],
      red: ['#3d1216', '#7d1814', '#b91c1c', '#f85149'],
      orange: ['#3d1e00', '#7c2d12', '#ea580c', '#ffa657'],
      blue: ['#0c2a6d', '#1e40af', '#2563eb', '#58a6ff']
    };
    
    const theme = this.getHabitTheme(habitColor);
    return colors[theme][level - 1] || colors.green[level - 1];
  }

  getHabitTheme(color) {
    const colorMap = {
      '#39d353': 'green',
      '#a371f7': 'purple',
      '#f85149': 'red',
      '#ffa657': 'orange',
      '#58a6ff': 'blue'
    };
    return colorMap[color] || 'green';
  }

  showTooltip(element, date, isCompleted, habit) {
    const tooltip = document.createElement('div');
    tooltip.className = 'heatmap-tooltip';
    
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    tooltip.textContent = `${formattedDate} - ${isCompleted ? 'Completed' : 'Not completed'}`;
    tooltip.style.cssText = `
      position: absolute;
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      box-shadow: 0 4px 12px var(--shadow);
      border: 1px solid var(--border-color);
      z-index: 1000;
      pointer-events: none;
      white-space: nowrap;
      transform: translateX(-50%);
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    
    element._tooltip = tooltip;
  }

  hideTooltip() {
    const tooltips = document.querySelectorAll('.heatmap-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
  }

  // Statistics calculation
  getHabitStats(habit) {
    const completions = Object.keys(habit.completions).filter(date => {
      const compDate = new Date(date);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return compDate >= oneYearAgo;
    });
    
    const total = completions.length;
    const weeks = Math.ceil((new Date() - new Date(oneYearAgo)) / (7 * 24 * 60 * 60 * 1000));
    const avgPerWeek = total / weeks;
    
    // Calculate longest streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const sortedDates = completions.sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const dayDiff = (currDate - prevDate) / (24 * 60 * 60 * 1000);
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { total, avgPerWeek, longestStreak };
  }

  // UI rendering
  renderDashboard() {
    const container = document.createElement('div');
    container.className = 'main-content';
    
    // Header
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <div class="header-content">
        <h1>HabitKit</h1>
        <button class="theme-toggle" onclick="app.toggleTheme()">
          <span class="icon">${this.isDarkMode ? '☀️' : '🌙'}</span>
          <span>${this.isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    `;
    
    // Habit form
    const form = document.createElement('div');
    form.className = 'habit-form';
    form.innerHTML = `
      <h3 class="form-title">Add New Habit</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="habit-name">Habit Name</label>
          <input type="text" id="habit-name" placeholder="e.g., Walk around the block" required>
        </div>
        <div class="form-group">
          <label for="habit-theme">Theme</label>
          <select id="habit-theme">
            <option value="green">Green</option>
            <option value="purple">Purple</option>
            <option value="red">Red</option>
            <option value="orange">Orange</option>
            <option value="blue">Blue</option>
          </select>
        </div>
        <button class="form-submit" onclick="app.handleAddHabit()">Add Habit</button>
      </div>
    `;
    
    // Habits grid
    const habitsGrid = document.createElement('div');
    habitsGrid.className = 'habits-grid';
    
    this.habits.forEach(habit => {
      const card = this.renderHabitCard(habit);
      habitsGrid.appendChild(card);
    });
    
    container.appendChild(header);
    container.appendChild(form);
    container.appendChild(habitsGrid);
    
    return container;
  }

  renderHabitCard(habit) {
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.style.setProperty('--habit-color', habit.color);
    
    // Header
    const header = document.createElement('div');
    header.className = 'habit-header';
    
    const info = document.createElement('div');
    info.className = 'habit-info';
    
    const name = document.createElement('h3');
    name.className = 'habit-name';
    name.textContent = habit.name;
    
    const description = document.createElement('p');
    description.className = 'habit-description';
    description.textContent = habit.description;
    
    info.appendChild(name);
    info.appendChild(description);
    
    const actions = document.createElement('div');
    actions.className = 'habit-actions';
    
    const today = new Date().toISOString().slice(0, 10);
    const completedToday = !!habit.completions[today];
    
    const completeBtn = document.createElement('button');
    completeBtn.className = `action-btn primary ${completedToday ? 'completed' : ''}`;
    completeBtn.textContent = completedToday ? '✓ Done' : 'Mark Today';
    completeBtn.onclick = () => this.toggleHabitCompletion(habit.id, new Date());
    
    const detailBtn = document.createElement('button');
    detailBtn.className = 'action-btn';
    detailBtn.innerHTML = '📊';
    detailBtn.title = 'View Details';
    detailBtn.onclick = () => this.showHabitDetail(habit);
    
    actions.appendChild(completeBtn);
    actions.appendChild(detailBtn);
    
    header.appendChild(info);
    header.appendChild(actions);
    
    // Heatmap
    const heatmap = this.renderHeatmap(habit, false);
    
    card.appendChild(header);
    card.appendChild(heatmap);
    
    return card;
  }

  renderHabitDetail(habit) {
    const container = document.createElement('div');
    container.className = 'main-content';
    
    // Header with back button
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <div class="header-content">
        <button class="action-btn" onclick="app.showDashboard()" style="margin-right: 16px;">
          ← Back
        </button>
        <h1>${habit.name}</h1>
        <button class="theme-toggle" onclick="app.toggleTheme()">
          <span class="icon">${this.isDarkMode ? '☀️' : '🌙'}</span>
          <span>${this.isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    `;
    
    // Large heatmap
    const heatmapSection = document.createElement('div');
    heatmapSection.className = 'heatmap-section';
    heatmapSection.appendChild(this.renderHeatmap(habit, true));
    
    // Statistics
    const stats = this.getHabitStats(habit);
    const statsSection = document.createElement('div');
    statsSection.className = 'stats-section';
    statsSection.innerHTML = `
      <h3 class="section-title">Statistics</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Completions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.avgPerWeek.toFixed(1)}</div>
          <div class="stat-label">Per Week</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.longestStreak}</div>
          <div class="stat-label">Longest Streak</div>
        </div>
      </div>
    `;
    
    container.appendChild(header);
    container.appendChild(heatmapSection);
    container.appendChild(statsSection);
    
    return container;
  }

  render() {
    const root = document.getElementById('root');
    root.innerHTML = '';
    
    let content;
    if (this.currentView === 'dashboard') {
      content = this.renderDashboard();
    } else if (this.currentView === 'detail') {
      content = this.renderHabitDetail(this.selectedHabit);
    }
    
    root.appendChild(content);
  }

  // Navigation
  showDashboard() {
    this.currentView = 'dashboard';
    this.selectedHabit = null;
    this.render();
  }

  showHabitDetail(habit) {
    this.currentView = 'detail';
    this.selectedHabit = habit;
    this.render();
  }

  // Event handlers
  handleAddHabit() {
    const nameInput = document.getElementById('habit-name');
    const themeSelect = document.getElementById('habit-theme');
    
    const name = nameInput.value.trim();
    const theme = themeSelect.value;
    
    if (!name) return;
    
    this.addHabit(name, `Track your progress with ${name.toLowerCase()}`, theme);
    
    nameInput.value = '';
    themeSelect.value = 'green';
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('light-mode', !this.isDarkMode);
    this.render();
  }

  setupEventListeners() {
    // Global click handler for tooltips
    document.addEventListener('click', () => {
      this.hideTooltip();
    });
  }
}

// Initialize the app
const app = new HabitKit(); 