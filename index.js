document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector('.slider');
  const slides = document.querySelectorAll('.slide');
  const prevBtn = document.querySelector('.prev');
  const nextBtn = document.querySelector('.next');
  let current = 0;

  function showSlide(index) {
    const offset = -index * 100;
    slider.style.transform = `translateX(${offset}%)`;
  }

  prevBtn.addEventListener('click', () => {
    current = (current - 1 + slides.length) % slides.length;
    showSlide(current);
  });

  nextBtn.addEventListener('click', () => {
    current = (current + 1) % slides.length;
    showSlide(current);
  });

  showSlide(current);
});
document.addEventListener('keydown', function(e) {
  if (e.key === "ArrowRight") document.querySelector(".slider-btn.next").click();
  if (e.key === "ArrowLeft") document.querySelector(".slider-btn.prev").click();
});
