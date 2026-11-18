const opening = document.querySelector('#opening');
const openButton = document.querySelector('#openInvitation');
const foldCard = document.querySelector('#foldCard');

openButton.addEventListener('click', () => {
  opening.classList.add('opened');
  window.setTimeout(() => document.querySelector('#invitation').scrollIntoView({ behavior: 'smooth' }), 1050);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    if (entry.target.contains(foldCard) || entry.target === foldCard) foldCard.classList.add('in-view');
    observer.unobserve(entry.target);
  });
}, { threshold: .18 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const eventStart = new Date('2027-04-18T16:30:00+08:00');
const eventEnd = new Date('2027-04-18T22:00:00+08:00');
const countdown = document.querySelector('#countdown');

function updateCountdown() {
  const days = Math.ceil((eventStart - new Date()) / 86400000);
  countdown.textContent = days > 0 ? `${days.toLocaleString()} days until we celebrate` : 'Today is our wedding day';
}
updateCountdown();

document.querySelector('#calendarButton').addEventListener('click', () => {
  const format = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Our Wedding Day//EN',
    'BEGIN:VEVENT', `DTSTART:${format(eventStart)}`, `DTEND:${format(eventEnd)}`,
    'SUMMARY:Our Wedding Day', 'LOCATION:Prive by the Sea',
    'DESCRIPTION:Sunset ceremony followed by dinner and celebration.',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  link.download = 'our-wedding-day.ics';
  link.click();
  URL.revokeObjectURL(link.href);
});
