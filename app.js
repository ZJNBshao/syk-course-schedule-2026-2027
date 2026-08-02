(() => {
  "use strict";

  const data = window.SCHEDULE_DATA;
  if (!data) {
    document.body.innerHTML = "<p style='padding:2rem'>课表数据加载失败，请确认 data.js 与页面位于同一目录。</p>";
    return;
  }

  const weekdayNames = { 一: "周一", 二: "周二", 三: "周三", 四: "周四", 五: "周五", 六: "周六", 日: "周日" };
  const timelineRows = [
    { kind: "section", number: 1, start: "08:30", end: "09:10" },
    { kind: "section", number: 2, start: "09:15", end: "09:55" },
    { kind: "section", number: 3, start: "10:20", end: "11:00" },
    { kind: "section", number: 4, start: "11:05", end: "11:45" },
    { kind: "section", number: 5, start: "11:50", end: "12:30" },
    { kind: "rest", label: "午间休息", start: "12:30", end: "14:00" },
    { kind: "section", number: 6, start: "14:00", end: "14:40" },
    { kind: "section", number: 7, start: "14:45", end: "15:25" },
    { kind: "section", number: 8, start: "15:45", end: "16:25" },
    { kind: "section", number: 9, start: "16:30", end: "17:10" },
    { kind: "rest", label: "晚间休息", start: "17:10", end: "19:30" },
    { kind: "section", number: 10, start: "19:30", end: "20:10" },
    { kind: "section", number: 11, start: "20:15", end: "20:55" },
    { kind: "section", number: 12, start: "21:00", end: "21:40" },
    { kind: "section", number: 13, start: "21:45", end: "22:25" },
  ];
  const sectionTimes = {
    1: ["08:30", "09:10"],
    2: ["09:15", "09:55"],
    3: ["10:20", "11:00"],
    4: ["11:05", "11:45"],
    5: ["11:50", "12:30"],
    6: ["14:00", "14:40"],
    7: ["14:45", "15:25"],
    8: ["15:45", "16:25"],
    9: ["16:30", "17:10"],
    10: ["19:30", "20:10"],
    11: ["20:15", "20:55"],
    12: ["21:00", "21:40"],
    13: ["21:45", "22:25"],
  };
  const hues = [11, 206, 151, 274, 42, 333, 184, 93, 231, 305, 66, 25, 169];
  const byId = new Map(data.events.map((event) => [event.id, event]));

  const elements = {
    grid: document.querySelector("#scheduleGrid"),
    weekSelect: document.querySelector("#weekSelect"),
    previousWeek: document.querySelector("#previousWeek"),
    nextWeek: document.querySelector("#nextWeek"),
    weekRange: document.querySelector("#weekRange"),
    weekStats: document.querySelector("#weekStats"),
    todayButton: document.querySelector("#todayButton"),
    dayTabs: document.querySelector("#dayTabs"),
    mobileAgenda: document.querySelector("#mobileAgenda"),
    nextCourse: document.querySelector("#nextCourse"),
    nextMeta: document.querySelector("#nextMeta"),
    themeButton: document.querySelector("#themeButton"),
    printButton: document.querySelector("#printButton"),
    dialog: document.querySelector("#courseDialog"),
    dialogAccent: document.querySelector("#dialogAccent"),
    dialogType: document.querySelector("#dialogType"),
    dialogTitle: document.querySelector("#dialogTitle"),
    dialogTopic: document.querySelector("#dialogTopic"),
    dialogDate: document.querySelector("#dialogDate"),
    dialogPeriod: document.querySelector("#dialogPeriod"),
    dialogLocation: document.querySelector("#dialogLocation"),
    dialogTeacher: document.querySelector("#dialogTeacher"),
  };

  const today = toLocalIso(new Date());
  const requestedWeek = Number(new URLSearchParams(location.search).get("week"));
  let currentWeekNumber = data.weeks.some((week) => week.number === requestedWeek)
    ? requestedWeek
    : findClosestWeek(today).number;
  let selectedDate = pickDefaultDate(currentWeekNumber);

  function toLocalIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseIso(date) {
    return new Date(`${date}T12:00:00`);
  }

  function formatMonthDay(date) {
    const parsed = parseIso(date);
    return `${parsed.getMonth() + 1}月${parsed.getDate()}日`;
  }

  function formatShort(date) {
    const parsed = parseIso(date);
    return `${parsed.getMonth() + 1}.${parsed.getDate()}`;
  }

  function findClosestWeek(date) {
    const exact = data.weeks.find((week) => week.days.some((day) => day.date === date));
    if (exact) return exact;
    return data.weeks.find((week) => week.days.at(-1).date >= date) ?? data.weeks.at(-1);
  }

  function getWeek(number = currentWeekNumber) {
    return data.weeks.find((week) => week.number === number);
  }

  function pickDefaultDate(weekNumber) {
    const week = getWeek(weekNumber);
    if (week.days.some((day) => day.date === today)) return today;
    const firstWithEvents = week.days.find((day) => eventsForDate(day.date).length);
    return (firstWithEvents ?? week.days[0]).date;
  }

  function eventsForWeek(weekNumber) {
    return data.events.filter((event) => event.week === weekNumber);
  }

  function eventsForDate(date) {
    return data.events
      .filter((event) => event.date === date)
      .sort((a, b) => (a.sections?.[0] ?? 99) - (b.sections?.[0] ?? 99) || a.course.localeCompare(b.course, "zh-CN"));
  }

  function hueFor(course) {
    const index = data.courses.indexOf(course);
    return hues[(index < 0 ? 0 : index) % hues.length];
  }

  function periodText(event) {
    if (event.sections?.length) {
      const first = event.sections[0];
      const last = event.sections.at(-1);
      return first === last ? `第 ${first} 节` : `第 ${first}–${last} 节`;
    }
    return event.periodLabel;
  }

  function locationText(event) {
    if (event.location) return event.location;
    if (event.type === "自主学习") return "自主学习";
    return "地点待定";
  }

  function timeText(event) {
    const timedSections = (event.sections ?? []).filter((section) => sectionTimes[section]);
    if (timedSections.length) {
      const first = timedSections[0];
      const last = timedSections.at(-1);
      return `${sectionTimes[first][0]}–${sectionTimes[last][1]}`;
    }
    return "时间待定";
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function setupWeekSelect() {
    for (const week of data.weeks) {
      const option = document.createElement("option");
      option.value = week.number;
      option.textContent = `第 ${week.number} 周`;
      elements.weekSelect.append(option);
    }
  }

  function render() {
    const week = getWeek();
    const weekEvents = eventsForWeek(currentWeekNumber);
    const uniqueCourses = new Set(weekEvents.map((event) => event.course));

    elements.weekSelect.value = String(currentWeekNumber);
    elements.previousWeek.disabled = currentWeekNumber === data.weeks[0].number;
    elements.nextWeek.disabled = currentWeekNumber === data.weeks.at(-1).number;
    elements.previousWeek.style.opacity = elements.previousWeek.disabled ? "0.35" : "1";
    elements.nextWeek.style.opacity = elements.nextWeek.disabled ? "0.35" : "1";
    elements.weekRange.textContent = `${formatMonthDay(week.days[0].date)}—${formatMonthDay(week.days.at(-1).date)}`;
    elements.weekStats.textContent = `${weekEvents.length} 次安排 · ${uniqueCourses.size} 门课程`;

    renderDesktop(week, weekEvents);
    renderDayTabs(week);
    renderAgenda();
    updateUrl();
  }

  function renderDesktop(week, weekEvents) {
    elements.grid.replaceChildren();

    const corner = createElement("div", "grid-corner", "时间 / 日期");
    corner.style.gridColumn = "1";
    corner.style.gridRow = "1";
    elements.grid.append(corner);

    week.days.forEach((day, dayIndex) => {
      const heading = createElement("div", "day-heading");
      if (day.date === today) heading.classList.add("is-today");
      if (dayIndex > 4) heading.classList.add("is-weekend");
      heading.style.gridColumn = String(dayIndex + 2);
      heading.style.gridRow = "1";
      heading.innerHTML = `<strong>${day.weekday}</strong><span>${formatShort(day.date)}</span>`;
      elements.grid.append(heading);
    });

    timelineRows.forEach((row, timelineIndex) => {
      const isRest = row.kind === "rest";
      if (isRest) {
        const restBand = createElement("div", "rest-band");
        restBand.style.gridColumn = "1 / -1";
        restBand.style.gridRow = String(timelineIndex + 2);
        restBand.innerHTML = `<span><strong>${row.label}</strong><small>${row.start}–${row.end}</small></span>`;
        elements.grid.append(restBand);
        return;
      }

      const heading = createElement("div", "period-heading");
      heading.style.gridColumn = "1";
      heading.style.gridRow = String(timelineIndex + 2);
      heading.innerHTML = `<strong>${row.start}–${row.end}</strong><span>第 ${row.number} 节</span>`;
      elements.grid.append(heading);

      week.days.forEach((_day, dayIndex) => {
        const cell = createElement("div", "slot-cell");
        if (dayIndex > 4) cell.classList.add("is-weekend");
        cell.style.gridColumn = String(dayIndex + 2);
        cell.style.gridRow = String(timelineIndex + 2);
        elements.grid.append(cell);
      });
    });

    for (const event of weekEvents) {
      const dayIndex = week.days.findIndex((day) => day.date === event.date);
      if (dayIndex < 0) continue;
      const card = createElement("button", "course-card");
      card.type = "button";
      card.dataset.eventId = event.id;
      card.style.setProperty("--course-hue", String(hueFor(event.course)));
      card.style.gridColumn = String(dayIndex + 2);
      const firstSectionIndex = timelineRows.findIndex((row) => row.number === event.sections?.[0]);
      const lastSectionIndex = timelineRows.findIndex((row) => row.number === event.sections?.at(-1));
      if (firstSectionIndex < 0 || lastSectionIndex < firstSectionIndex) continue;
      card.style.gridRow = `${firstSectionIndex + 2} / span ${lastSectionIndex - firstSectionIndex + 1}`;
      card.setAttribute("aria-label", `查看${event.course}详情`);
      card.innerHTML = `
        <span class="course-type">${escapeHtml(event.type)}</span>
        <h3>${escapeHtml(event.course)}</h3>
        <p>${escapeHtml(locationText(event))}</p>
        <p>${escapeHtml(timeText(event))}</p>
      `;
      elements.grid.append(card);
    }
  }

  function renderDayTabs(week) {
    if (!week.days.some((day) => day.date === selectedDate)) selectedDate = pickDefaultDate(week.number);
    elements.dayTabs.replaceChildren();

    week.days.forEach((day) => {
      const button = createElement("button", "day-tab");
      button.type = "button";
      button.role = "tab";
      button.dataset.date = day.date;
      button.classList.toggle("is-active", day.date === selectedDate);
      button.classList.toggle("has-events", eventsForDate(day.date).length > 0);
      button.setAttribute("aria-selected", String(day.date === selectedDate));
      button.innerHTML = `<strong>${day.weekday}</strong><span>${formatShort(day.date)}</span>`;
      elements.dayTabs.append(button);
    });
  }

  function renderAgenda() {
    const day = getWeek().days.find((item) => item.date === selectedDate);
    const events = eventsForDate(selectedDate);
    elements.mobileAgenda.replaceChildren();

    const heading = createElement("div", "agenda-heading");
    heading.innerHTML = `<h2>${weekdayNames[day.weekday]} · ${formatMonthDay(day.date)}</h2><span>${events.length} 次安排</span>`;
    elements.mobileAgenda.append(heading);

    if (!events.length) {
      const empty = createElement("div", "empty-agenda");
      empty.innerHTML = "<div><span>☕</span><p>今天没有课程，给自己留点空白。</p></div>";
      elements.mobileAgenda.append(empty);
      return;
    }

    const list = createElement("div", "agenda-list");
    for (const event of events) {
      const card = createElement("button", "agenda-card");
      card.type = "button";
      card.dataset.eventId = event.id;
      card.style.setProperty("--course-hue", String(hueFor(event.course)));
      card.innerHTML = `
        <span class="agenda-period">${escapeHtml(timeText(event))}</span>
        <span class="agenda-main">
          <strong>${escapeHtml(event.course)}</strong>
          <span>${escapeHtml(locationText(event))}</span>
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      `;
      list.append(card);
    }
    elements.mobileAgenda.append(list);
  }

  function renderNextCourse() {
    const upcoming = data.events
      .filter((event) => event.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.sections?.[0] ?? 99) - (b.sections?.[0] ?? 99))[0];

    if (!upcoming) {
      elements.nextCourse.textContent = "本学期课程已结束";
      elements.nextMeta.textContent = "辛苦啦，好好休息";
      return;
    }

    elements.nextCourse.textContent = upcoming.course;
    const dayLabel = upcoming.date === today ? "今天" : `${formatMonthDay(upcoming.date)} · ${weekdayNames[upcoming.weekday]}`;
    elements.nextMeta.textContent = `${dayLabel} · ${timeText(upcoming)} · ${locationText(upcoming)}`;
  }

  function showEvent(eventId) {
    const event = byId.get(eventId);
    if (!event) return;
    const hue = hueFor(event.course);
    elements.dialogAccent.style.setProperty("--course-hue", String(hue));
    elements.dialogType.style.setProperty("--course-hue", String(hue));
    elements.dialogType.textContent = event.type;
    elements.dialogTitle.textContent = event.course;
    elements.dialogTopic.textContent = event.topic || "本次课程暂无主题说明。";
    elements.dialogDate.textContent = `第 ${event.week} 周 · ${formatMonthDay(event.date)} · ${weekdayNames[event.weekday]}`;
    elements.dialogPeriod.textContent = `${periodText(event)} · ${timeText(event)}${event.session ? `（${event.session}）` : ""}`;
    elements.dialogLocation.textContent = locationText(event);
    elements.dialogTeacher.textContent = event.teacher || "未注明";
    elements.dialog.showModal();
  }

  function changeWeek(nextNumber) {
    if (!data.weeks.some((week) => week.number === nextNumber)) return;
    currentWeekNumber = nextNumber;
    selectedDate = pickDefaultDate(currentWeekNumber);
    render();
  }

  function updateUrl() {
    const url = new URL(location.href);
    url.searchParams.set("week", String(currentWeekNumber));
    history.replaceState(null, "", url);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setupTheme() {
    const saved = localStorage.getItem("schedule-theme");
    const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = saved || preferred;
  }

  elements.weekSelect.addEventListener("change", (event) => changeWeek(Number(event.target.value)));
  elements.previousWeek.addEventListener("click", () => changeWeek(currentWeekNumber - 1));
  elements.nextWeek.addEventListener("click", () => changeWeek(currentWeekNumber + 1));
  elements.todayButton.addEventListener("click", () => changeWeek(findClosestWeek(today).number));
  elements.printButton.addEventListener("click", () => window.print());
  elements.themeButton.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("schedule-theme", next);
  });
  elements.grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-event-id]");
    if (card) showEvent(card.dataset.eventId);
  });
  elements.mobileAgenda.addEventListener("click", (event) => {
    const card = event.target.closest("[data-event-id]");
    if (card) showEvent(card.dataset.eventId);
  });
  elements.dayTabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-date]");
    if (!tab) return;
    selectedDate = tab.dataset.date;
    renderDayTabs(getWeek());
    renderAgenda();
  });
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) elements.dialog.close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key === "ArrowLeft") changeWeek(currentWeekNumber - 1);
    if (event.altKey && event.key === "ArrowRight") changeWeek(currentWeekNumber + 1);
  });

  setupTheme();
  setupWeekSelect();
  renderNextCourse();
  render();
})();
