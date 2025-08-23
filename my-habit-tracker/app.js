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

  deleteHabit(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return;

    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete "${habit.name}"?\n\nThis action cannot be undone and will permanently remove all completion data for this habit.`);
    
    if (confirmed) {
      // Remove habit from array
      this.habits = this.habits.filter(h => h.id !== habitId);
      this.saveHabits();
      
      // If we're viewing this habit's detail, go back to dashboard
      if (this.currentView === 'detail' && this.selectedHabit && this.selectedHabit.id === habitId) {
        this.showDashboard();
      } else {
        this.render();
      }
      
      // Show success message
      this.showNotification(`Habit "${habit.name}" has been deleted successfully.`, 'success');
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'var(--habit-green)' : type === 'error' ? 'var(--habit-red)' : 'var(--habit-blue)'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-weight: 500;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
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
    
    // Create synchronized scrolling container
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'heatmap-scroll-container';
    
    // Month labels (X-axis) - now inside scroll container
    const monthLabels = document.createElement('div');
    monthLabels.className = 'month-labels';
    monthLabels.style.cssText = `
      display: grid;
      grid-template-columns: repeat(53, 1fr);
      gap: 3px;
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--text-secondary);
      min-width: max-content;
    `;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthPositions = [0, 4, 8, 13, 17, 22, 26, 30, 35, 39, 43, 47];
    
    monthPositions.forEach((pos, i) => {
      const monthLabel = document.createElement('div');
      monthLabel.textContent = months[i];
      monthLabel.style.gridColumn = `${pos + 1} / span 4`;
      monthLabel.style.textAlign = 'center';
      monthLabel.style.fontWeight = '600';
      monthLabels.appendChild(monthLabel);
    });
    
    // Main heatmap grid - now inside scroll container
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
      min-width: max-content;
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
    
    // Add both month labels and grid to scroll container
    scrollContainer.appendChild(monthLabels);
    scrollContainer.appendChild(grid);
    
    // Add scroll container to main container
    container.appendChild(scrollContainer);
    
    // Auto-scroll to current month after a short delay to ensure rendering
    setTimeout(() => {
      this.scrollToCurrentMonth(scrollContainer);
    }, 100);
    
    return container;
  }

  // Scroll to current month for better UX
  scrollToCurrentMonth(scrollContainer) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    // Calculate scroll position to center current month
    // Each month spans roughly 4-5 weeks, so we'll center on the current month
    const monthPositions = [0, 4, 8, 13, 17, 22, 26, 30, 35, 39, 43, 47];
    const currentMonthPosition = monthPositions[currentMonth];
    
    if (currentMonthPosition !== undefined) {
      // Calculate scroll position to show current month in the center
      // We want to show 4 months, so center the current month
      const cellWidth = 12; // Width of each cell
      const gap = 3; // Gap between cells
      const monthWidth = (cellWidth + gap) * 4; // Width of 4 weeks
      
      // Calculate scroll position to center current month
      const scrollPosition = Math.max(0, (currentMonthPosition * (cellWidth + gap)) - (monthWidth / 2));
      
      scrollContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
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
    
    const headerContent = document.createElement('div');
    headerContent.className = 'header-content';
    
    const title = document.createElement('h1');
    title.textContent = 'HabitKit';
    
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.onclick = () => this.toggleTheme();
    
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = this.isDarkMode ? '☀️' : '🌙';
    
    const toggleText = document.createElement('span');
    toggleText.textContent = this.isDarkMode ? 'Light' : 'Dark';
    
    themeToggle.appendChild(icon);
    themeToggle.appendChild(toggleText);
    
    headerContent.appendChild(title);
    headerContent.appendChild(themeToggle);
    header.appendChild(headerContent);
    
    // Habit form
    const form = document.createElement('div');
    form.className = 'habit-form';
    
    const formTitle = document.createElement('h3');
    formTitle.className = 'form-title';
    formTitle.textContent = 'Add New Habit';
    
    const formGrid = document.createElement('div');
    formGrid.className = 'form-grid';
    
    // Name input group
    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';
    
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'habit-name');
    nameLabel.textContent = 'Habit Name';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'habit-name';
    nameInput.placeholder = 'e.g., Walk around the block';
    nameInput.required = true;
    
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    
    // Theme select group
    const themeGroup = document.createElement('div');
    themeGroup.className = 'form-group';
    
    const themeLabel = document.createElement('label');
    themeLabel.setAttribute('for', 'habit-theme');
    themeLabel.textContent = 'Theme';
    
    const themeSelect = document.createElement('select');
    themeSelect.id = 'habit-theme';
    
    const themes = ['green', 'purple', 'red', 'orange', 'blue'];
    themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme;
      option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
      themeSelect.appendChild(option);
    });
    
    themeGroup.appendChild(themeLabel);
    themeGroup.appendChild(themeSelect);
    
    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'form-submit';
    submitBtn.textContent = 'Add Habit';
    submitBtn.onclick = () => this.handleAddHabit();
    
    // Add form submission handling
    const formElement = document.createElement('form');
    formElement.onsubmit = (e) => {
      e.preventDefault();
      this.handleAddHabit();
    };
    
    formGrid.appendChild(nameGroup);
    formGrid.appendChild(themeGroup);
    formGrid.appendChild(submitBtn);
    
    formElement.appendChild(formGrid);
    
    form.appendChild(formTitle);
    form.appendChild(formElement);
    
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
    
    // Delete button at bottom right
    const deleteSection = document.createElement('div');
    deleteSection.className = 'habit-delete-section';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '🗑️ Delete Habit';
    deleteBtn.title = 'Delete this habit permanently';
    deleteBtn.onclick = () => this.deleteHabit(habit.id);
    
    deleteSection.appendChild(deleteBtn);
    
    card.appendChild(header);
    card.appendChild(heatmap);
    card.appendChild(deleteSection);
    
    return card;
  }

  renderHabitDetail(habit) {
    const container = document.createElement('div');
    container.className = 'main-content';
    
    // Header with back button
    const header = document.createElement('header');
    header.className = 'header';
    
    const headerContent = document.createElement('div');
    headerContent.className = 'header-content';
    
    const backBtn = document.createElement('button');
    backBtn.className = 'action-btn';
    backBtn.textContent = '← Back';
    backBtn.style.marginRight = '16px';
    backBtn.onclick = () => this.showDashboard();
    
    const title = document.createElement('h1');
    title.textContent = habit.name;
    
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.onclick = () => this.toggleTheme();
    
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = this.isDarkMode ? '☀️' : '🌙';
    
    const toggleText = document.createElement('span');
    toggleText.textContent = this.isDarkMode ? 'Light' : 'Dark';
    
    themeToggle.appendChild(icon);
    themeToggle.appendChild(toggleText);
    
    headerContent.appendChild(backBtn);
    headerContent.appendChild(title);
    headerContent.appendChild(themeToggle);
    header.appendChild(headerContent);
    
    // Large heatmap
    const heatmapSection = document.createElement('div');
    heatmapSection.className = 'heatmap-section';
    heatmapSection.appendChild(this.renderHeatmap(habit, true));
    
    // Statistics
    const stats = this.getHabitStats(habit);
    const statsSection = document.createElement('div');
    statsSection.className = 'stats-section';
    
    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = 'Statistics';
    
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';
    
    // Total completions stat
    const totalStat = document.createElement('div');
    totalStat.className = 'stat-card';
    
    const totalValue = document.createElement('div');
    totalValue.className = 'stat-value';
    totalValue.textContent = stats.total;
    
    const totalLabel = document.createElement('div');
    totalLabel.className = 'stat-label';
    totalLabel.textContent = 'Total Completions';
    
    totalStat.appendChild(totalValue);
    totalStat.appendChild(totalLabel);
    
    // Per week stat
    const weekStat = document.createElement('div');
    weekStat.className = 'stat-card';
    
    const weekValue = document.createElement('div');
    weekValue.className = 'stat-value';
    weekValue.textContent = stats.avgPerWeek.toFixed(1);
    
    const weekLabel = document.createElement('div');
    weekLabel.className = 'stat-label';
    weekLabel.textContent = 'Per Week';
    
    weekStat.appendChild(weekValue);
    weekStat.appendChild(weekLabel);
    
    // Longest streak stat
    const streakStat = document.createElement('div');
    streakStat.className = 'stat-card';
    
    const streakValue = document.createElement('div');
    streakValue.className = 'stat-value';
    streakValue.textContent = stats.longestStreak;
    
    const streakLabel = document.createElement('div');
    streakLabel.className = 'stat-label';
    streakLabel.textContent = 'Longest Streak';
    
    streakStat.appendChild(streakValue);
    streakStat.appendChild(streakLabel);
    
    statsGrid.appendChild(totalStat);
    statsGrid.appendChild(weekStat);
    statsGrid.appendChild(streakStat);
    
    statsSection.appendChild(sectionTitle);
    statsSection.appendChild(statsGrid);
    
    // Delete button in detail view
    const deleteSection = document.createElement('div');
    deleteSection.className = 'habit-delete-section detail-view';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn danger';
    deleteBtn.innerHTML = '🗑️ Delete Habit';
    deleteBtn.title = 'Delete this habit permanently';
    deleteBtn.onclick = () => this.deleteHabit(habit.id);
    
    deleteSection.appendChild(deleteBtn);
    
    container.appendChild(header);
    container.appendChild(heatmapSection);
    container.appendChild(statsSection);
    container.appendChild(deleteSection);
    
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
    console.log('handleAddHabit called'); // Debug log
    
    const nameInput = document.getElementById('habit-name');
    const themeSelect = document.getElementById('habit-theme');
    
    if (!nameInput || !themeSelect) {
      console.error('Form elements not found:', { nameInput, themeSelect });
      return;
    }
    
    const name = nameInput.value.trim();
    const theme = themeSelect.value;
    
    console.log('Form values:', { name, theme }); // Debug log
    
    if (!name) {
      console.log('No name provided, returning');
      return;
    }
    
    console.log('Adding habit:', { name, theme }); // Debug log
    
    this.addHabit(name, `Track your progress with ${name.toLowerCase()}`, theme);
    
    // Reset form
    nameInput.value = '';
    themeSelect.value = 'green';
    
    // Focus back to name input for better UX
    nameInput.focus();
    
    console.log('Habit added successfully'); // Debug log
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