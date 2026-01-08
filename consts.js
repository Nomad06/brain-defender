// Общие константы для всех скриптов расширения
// Используем условное объявление, чтобы избежать ошибок при повторной загрузке
if (typeof STORAGE_KEY === 'undefined') {
  var STORAGE_KEY = "blockedSites";
}
if (typeof I18N_STORAGE_KEY === 'undefined') {
  var I18N_STORAGE_KEY = "i18n_language";
}
if (typeof STATS_STORAGE_KEY === 'undefined') {
  var STATS_STORAGE_KEY = "blockStats";
}
if (typeof MIGRATION_VERSION_KEY === 'undefined') {
  var MIGRATION_VERSION_KEY = "dataMigrationVersion";
}
if (typeof TEMP_WHITELIST_KEY === 'undefined') {
  var TEMP_WHITELIST_KEY = "tempWhitelist";
}
