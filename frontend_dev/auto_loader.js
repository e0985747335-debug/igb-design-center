// auto_loader.js - 簡單模組化載入器 (placeholder)
window.autoLoader = (function(){
  const MODULES = {
    'finance_module': '/static/components/finance_module.js',
    'expense_mgmt_module': '/static/components/expense_mgmt_module.js',
    'project_mgmt_module': '/static/components/project_mgmt_module.js',
    'scm_module': '/static/components/scm_module.js',
    'wms_module': '/static/components/wms_module.js',
    'hr_module': '/static/components/hr_module.js',
    'crm_module': '/static/components/crm_module.js',
    'gl_module': '/static/components/gl_module.js',
    'fa_module': '/static/components/fa_module.js',
    'ar_module': '/static/components/ar_module.js',
    'ap_module': '/static/components/ap_module.js'
  };

  function loadScript(url){
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = () => resolve(url);
      s.onerror = () => reject(new Error('載入失敗: '+url));
      document.head.appendChild(s);
    });
  }

  async function loadModule(moduleName){
    const url = MODULES[moduleName];
    if(!url) throw new Error('未知模組: '+moduleName);
    await loadScript(url);
    // 模組檔應該會在載入後註冊 window.IGB_MODULE_<name>.init()
    const fn = window['IGB_MODULE_'+moduleName.toUpperCase()];
    if(fn && typeof fn.init === 'function'){
      fn.init(document.getElementById('module-container'));
    } else {
      document.getElementById('module-container').innerText = moduleName + ' loaded. (請實作 init 函式)';
    }
  }

  return {
    init: function(opts){
      const defaultModule = (opts && opts.defaultModule) || 'finance_module';
      loadModule(defaultModule).catch(err=>{
        console.error(err);
        document.getElementById('module-container').innerText = '模組載入錯誤: ' + err.message;
      });
    },
    loadModule
  };
})();
