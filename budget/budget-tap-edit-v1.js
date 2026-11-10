/*
 * Budget pages: the whole "Budget 1 000" text under an item is a tap target, not just the
 * small number. Tapping anywhere on it opens the same inline editor (editBudget).
 */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var td = e.target.closest('.section-card[data-section-key] .items-table tbody td:nth-child(2)');
    if (!td || e.target.closest('input, .editable-field')) return;
    var field = td.querySelector('.editable-field');
    if (field) field.click();
  });
})();
