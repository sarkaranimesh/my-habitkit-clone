// HabitKit - GitHub-Style Habit Tracker with Monthly Calendar View
// Enhanced version with monthly calendar layout

class HabitKit {
  constructor() {
    this.habits = [];
    this.currentView = 'dashboard'; // 'dashboard' or 'detail'
    this.selectedHabit = null;
    this.isDarkMode = true;
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
    
    this.init();
  }

  init() {
    this.loadHabits();
    this.setupEventListeners();
    this.render();
  }

  // Monthly calendar utilities
  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  getMonthName(month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  }

  getPreviousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.render();
  }

  getNextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.render();
  }

  // GitHub-style heatmap utilities
  getStartOfYear(year = new Date().getFullYear()) {
    return new Date(year, 0, 1);
  }

  getFirstSunday(year = new Date().getFullYear()) {
    const startOfYear = this.getStartOfYear(year);
    const dayOfWeek = startOfYear.getDay(); // 0 = Sunday
    const firstSunday = new Date(startOfYear);
    if (dayOfWeek !== 0) {
      firstSunday.setDate(startOfYear.getDate() - dayOfWeek);
    }
    return firstSunday;
  }

  getWeeksInYear(year = new Date().getFullYear()) {
    const firstSunday = this.getFirstSunday(year);
    const lastDayOfYear = new Date(year, 11, 31);
    const daysDiff = Math.ceil((lastDayOfYear - firstSunday) / (1000 * 60 * 60 * 24));
    return Math.ceil(daysDiff / 7);
  }

  getDateFromWeekAndDay(weekIndex, dayIndex, year = new Date().getFullYear()) {
    const firstSunday = this.getFirstSunday(year);
    const targetDate = new Date(firstSunday);
    targetDate.setDate(firstSunday.getDate() + (weekIndex * 7) + dayIndex);
    return targetDate;
  }

  // Heatmap completion level (binary for now)
  getHeatmapCompletionLevel(habit, date) {
    const dateStr = date.toISOString().slice(0, 10);
    return habit.completions[dateStr] ? 1 : 0;
  }

  // Heatmap color progression
  getHeatmapColor(level, habitColor) {
    if (level === 0) return 'var(--heatmap-empty)';
    const colors = {
      '#39d353': ['#0e4429', '#006d32', '#26a641', '#39d353'],
      '#a371f7': ['#1a103d', '#4c2889', '#7c3aed', '#a371f7'],
      '#f85149': ['#3d1216', '#7d1814', '#b91c1c', '#f85149'],
      '#ffa657': ['#3d1e00', '#7c2d12', '#ea580c', '#ffa657'],
      '#58a6ff': ['#0c2a6d', '#1e40af', '#2563eb', '#58a6ff']
    };
    const colorArray = colors[habitColor] || colors['#39d353'];
    return colorArray[level - 1] || colorArray[0];
  }

  // Heatmap tooltip
  showHeatmapTooltip(element, date, isCompleted) {
    const tooltip = document.createElement('div');
    tooltip.className = 'heatmap-tooltip';
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    tooltip.textContent = `${formattedDate} - ${isCompleted ? 'Completed' : 'Not completed'}`;
    document.body.appendChild(tooltip);
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.left < 10) {
      tooltip.style.left = '10px';
      tooltip.style.transform = 'none';
    } else if (tooltipRect.right > window.innerWidth - 10) {
      tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
      tooltip.style.transform = 'none';
    }
    element._tooltip = tooltip;
  }

  hideHeatmapTooltips() {
    const tooltips = document.querySelectorAll('.heatmap-tooltip');
    tooltips.forEach(t => t.remove());
  }

  // Heatmap rendering
  renderHeatmap(habit, isLarge = false) {
    const container = document.createElement('div');
    container.className = 'heatmap-container';
    const header = document.createElement('div');
    header.className = 'heatmap-header';
    const title = document.createElement('div');
    title.className = 'heatmap-title';
    title.textContent = isLarge ? 'One year of activity' : 'Activity overview';
    const legend = document.createElement('div');
    legend.className = 'heatmap-legend';
    const lessText = document.createElement('span');
    lessText.className = 'legend-text';
    lessText.textContent = 'Less';
    const squares = document.createElement('div');
    squares.className = 'legend-squares';
    for (let i = 0; i <= 4; i++) {
      const square = document.createElement('div');
      square.className = `legend-square level-${i}`;
      square.style.background = this.getHeatmapColor(i, habit.color);
      squares.appendChild(square);
    }
    const moreText = document.createElement('span');
    moreText.className = 'legend-text';
    moreText.textContent = 'More';
    legend.appendChild(lessText);
    legend.appendChild(squares);
    legend.appendChild(moreText);
    header.appendChild(title);
    header.appendChild(legend);
    container.appendChild(header);
    const wrapper = document.createElement('div');
    wrapper.className = 'heatmap-wrapper';
    const gridContainer = document.createElement('div');
    gridContainer.className = 'heatmap-grid-container';
    const dayLabels = document.createElement('div');
    dayLabels.className = 'day-labels';
    const dayNames = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    dayNames.forEach(day => {
      const label = document.createElement('div');
      label.className = 'day-label';
      label.textContent = day;
      dayLabels.appendChild(label);
    });
    const mainArea = document.createElement('div');
    mainArea.className = 'heatmap-main';
    const { monthLabels, grid } = this.createHeatmapGrid(habit);
    mainArea.appendChild(monthLabels);
    mainArea.appendChild(grid);
    gridContainer.appendChild(dayLabels);
    gridContainer.appendChild(mainArea);
    wrapper.appendChild(gridContainer);
    container.appendChild(wrapper);
    return container;
  }

  createHeatmapGrid(habit) {
    const currentYear = new Date().getFullYear();
    const weeksInYear = this.getWeeksInYear(currentYear);
    const today = new Date();
    const monthLabels = document.createElement('div');
    monthLabels.className = 'month-labels';
    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';
    const monthPositions = [];
    let currentMonth = -1;
    for (let week = 0; week < weeksInYear; week++) {
      const weekColumn = document.createElement('div');
      weekColumn.className = 'week-column';
      let weekWidth = 0;
      for (let day = 0; day < 7; day++) {
        const cellDate = this.getDateFromWeekAndDay(week, day, currentYear);
        if (cellDate.getMonth() !== currentMonth && cellDate <= today) {
          currentMonth = cellDate.getMonth();
          const monthName = cellDate.toLocaleDateString('en-US', { month: 'short' });
          monthPositions.push({ week, monthName, width: 0 });
        }
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        if (cellDate > today || cellDate.getFullYear() !== currentYear) {
          cell.style.visibility = 'hidden';
        } else {
          const level = this.getHeatmapCompletionLevel(habit, cellDate);
          cell.classList.add(`level-${level}`);
          cell.addEventListener('click', () => {
            this.toggleHabitCompletion(habit.id, cellDate);
          });
          cell.addEventListener('mouseenter', (e) => {
            this.showHeatmapTooltip(e.target, cellDate, level > 0);
          });
          cell.addEventListener('mouseleave', () => {
            this.hideHeatmapTooltips();
          });
        }
        weekColumn.appendChild(cell);
        weekWidth = Math.max(weekWidth, 13);
      }
      grid.appendChild(weekColumn);
      if (monthPositions.length > 0) {
        monthPositions[monthPositions.length - 1].width += weekWidth;
      }
    }
    monthPositions.forEach(({ monthName, width }) => {
      const label = document.createElement('div');
      label.className = 'month-label';
      label.textContent = monthName;
      label.style.width = `${Math.max(width, 30)}px`;
      monthLabels.appendChild(label);
    });
    return { monthLabels, grid };
  }

  // Monthly calendar completion level
  getCompletionLevel(habit, date) {
    const dateStr = date.toISOString().slice(0, 10);
    return habit.completions[dateStr] ? 1 : 0;
  }

  // Data management
  loadHabits() {
    const saved = localStorage.getItem('habitkit-habits');
    if (saved) {
      this.habits = JSON.parse(saved);
    } else {
      // Default habits with sample data
      this.habits = [
        {
          id: 1,
          name: 'Walk around the block',
          description: 'Go for a short walk to clear the mind',
          color: '#39d353', // GitHub green
          theme: 'green',
          completions: this.generateSampleData()
        },
        {
          id: 2,
          name: 'Learn Norwegian',
          description: 'Practice Norwegian language skills',
          color: '#a371f7', // GitHub purple
          theme: 'purple',
          completions: this.generateSampleData()
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

  generateSampleData() {
    const completions = {};
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    
    // Generate realistic completion pattern (about 30% completion rate)
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      if (Math.random() > 0.7) {
        completions[d.toISOString().slice(0, 10)] = true;
      }
    }
    
    return completions;
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

  // Monthly calendar rendering
  renderMonthlyCalendar(habit, isLarge = false) {
    const container = document.createElement('div');
    container.className = 'calendar-container';
    
    // Header with month navigation
    const header = document.createElement('div');
    header.className = 'calendar-header';
    
    const title = document.createElement('div');
    title.className = 'calendar-title';
    title.textContent = isLarge ? `${this.getMonthName(this.currentMonth)} ${this.currentYear}` : 'Monthly View';
    
    const navigation = document.createElement('div');
    navigation.className = 'calendar-navigation';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'nav-btn prev-btn';
    prevBtn.innerHTML = '←';
    prevBtn.onclick = () => this.getPreviousMonth();
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'nav-btn next-btn';
    nextBtn.innerHTML = '→';
    nextBtn.onclick = () => this.getNextMonth();
    
    navigation.appendChild(prevBtn);
    navigation.appendChild(title);
    navigation.appendChild(nextBtn);
    
    header.appendChild(navigation);
    container.appendChild(header);
    
    // Calendar grid
    const calendar = this.createMonthlyCalendar(habit);
    container.appendChild(calendar);
    
    return container;
  }

  createMonthlyCalendar(habit) {
    const calendar = document.createElement('div');
    calendar.className = 'monthly-calendar';
    
    // Day headers (Sun, Mon, Tue, etc.)
    const dayHeaders = document.createElement('div');
    dayHeaders.className = 'day-headers';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
      const header = document.createElement('div');
      header.className = 'day-header';
      header.textContent = day;
      dayHeaders.appendChild(header);
    });
    
    // Calendar grid
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    
    const daysInMonth = this.getDaysInMonth(this.currentYear, this.currentMonth);
    const firstDayOfMonth = this.getFirstDayOfMonth(this.currentYear, this.currentMonth);
    const today = new Date();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day empty';
      grid.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      
      const date = new Date(this.currentYear, this.currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date <= today;
      
      if (isToday) {
        cell.classList.add('today');
      }
      
      if (isPast) {
        const level = this.getCompletionLevel(habit, date);
        cell.classList.add(`level-${level}`);
        
        // Add click handler for past dates
        cell.addEventListener('click', () => {
          this.toggleHabitCompletion(habit.id, date);
        });
        
        // Add tooltip
        cell.addEventListener('mouseenter', (e) => {
          this.showTooltip(e.target, date, level > 0, habit);
        });
        
        cell.addEventListener('mouseleave', () => {
          this.hideTooltip();
        });
      } else {
        cell.classList.add('future');
      }
      
      const dayNumber = document.createElement('span');
      dayNumber.className = 'day-number';
      dayNumber.textContent = day;
      cell.appendChild(dayNumber);
      
      grid.appendChild(cell);
    }
    
    calendar.appendChild(dayHeaders);
    calendar.appendChild(grid);
    
    return calendar;
  }

  getCalendarColor(level, habitColor) {
    if (level === 0) return 'var(--calendar-empty)';
    
    // Calendar color progression
    const colors = {
      '#39d353': ['#0e4429', '#006d32', '#26a641', '#39d353'],
      '#a371f7': ['#1a103d', '#4c2889', '#7c3aed', '#a371f7'],
      '#f85149': ['#3d1216', '#7d1814', '#b91c1c', '#f85149'],
      '#ffa657': ['#3d1e00', '#7c2d12', '#ea580c', '#ffa657'],
      '#58a6ff': ['#0c2a6d', '#1e40af', '#2563eb', '#58a6ff']
    };
    
    const colorArray = colors[habitColor] || colors['#39d353'];
    return colorArray[level - 1] || colorArray[0];
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
    tooltip.className = 'calendar-tooltip';
    
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    tooltip.textContent = `${formattedDate} - ${isCompleted ? 'Completed' : 'Not completed'}`;
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    
    // Adjust if tooltip goes off screen
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.left < 10) {
      tooltip.style.left = '10px';
      tooltip.style.transform = 'none';
    } else if (tooltipRect.right > window.innerWidth - 10) {
      tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
      tooltip.style.transform = 'none';
    }
    
    element._tooltip = tooltip;
  }

  hideTooltip() {
    // Simple tooltip hiding - can be enhanced later
    const tooltips = document.querySelectorAll('.calendar-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
  }

  // Statistics calculation (keeping your original method)
  getHabitStats(habit) {
    const completions = Object.keys(habit.completions).filter(date => {
      const compDate = new Date(date);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return compDate >= oneYearAgo;
    });
    
    const total = completions.length;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const weeks = Math.ceil((new Date() - oneYearAgo) / (7 * 24 * 60 * 60 * 1000));
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

  // UI rendering (keeping your original structure but with updated calendar)
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
    
    formGrid.appendChild(nameGroup);
    formGrid.appendChild(themeGroup);
    formGrid.appendChild(submitBtn);
    
    form.appendChild(formTitle);
    form.appendChild(formGrid);
    
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
    
    // GitHub-style heatmap
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
    
    // Large heatmap section
    const calendarSection = document.createElement('div');
    calendarSection.className = 'calendar-section';
    calendarSection.appendChild(this.renderHeatmap(habit, true));
    
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
    
    // Add stats to grid
    statsGrid.appendChild(totalStat);
    statsGrid.appendChild(weekStat);
    statsGrid.appendChild(streakStat);
    
    // Add stats section to container
    statsSection.appendChild(sectionTitle);
    statsSection.appendChild(statsGrid);
    
    // Add calendar section to container
    container.appendChild(calendarSection);
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
      this.hideHeatmapTooltips();
    });
  }

  hideTooltip() {
    // Simple tooltip hiding - can be enhanced later
    const tooltips = document.querySelectorAll('.calendar-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
    // Also remove any heatmap tooltips for safety
    this.hideHeatmapTooltips();
  }
}

// Initialize the app
const app = new HabitKit();     
