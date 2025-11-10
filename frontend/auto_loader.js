// frontend/auto_loader.js
// Simple modular loader for IGB frontend
// - 動態載入 /static/components/<module>.js
// - 提供 switchModule(moduleKey) 全域函式
// - window.autoLoader.init({ defaultModule: 'project_mgmt_module' })

(function(global){
  const DEBUG = true;

  // 模組對應（component filename without .js）
  // 預設情況會嘗試載入 components/<moduleKey>.js
  const normalize = (k) => k.replace(/[-\s]/g, '_');

  const state = {
    loaded: {},   // moduleKey -> { initialized: true }
    current: null,
    componentsPath: '/static/components/', // served by FastAPI /static
    containerId: 'module-container'
  };

  function log(...args){ if(DEBUG) console.info('[auto_loader]', ...args); }

  // 取得 container 元素
  function getContainer(){
    return document.getElementById(state.containerId) || (function(){
      const el = document.createElement('div');
      el.id = state.containerId;
      document.getElementById('app-root')?.appendChild(el);
      return el;
    })();
  }

  // 動態載入一個 script，回傳 Promise
  function loadScript(url){
    return new Promise((resolve, reject) => {
      // already loaded?
      if (document.querySelector(`script[data-src="${url}"]`)){
        return resolve();
      }
      const s = document.createElement('script');
      s.async = false;
      s.defer = false;
      s.setAttribute('data-src', url);
      s.onload = () => { log('loaded', url); resolve(); };
      s.onerror = (e) => { console.error('loadScript error', url, e); reject(new Error('Failed to load '+url)); };
      s.src = url;
      document.head.appendChild(s);
    });
  }

  // 嘗試載入 module：會載入 /static/components/<moduleKey>.js
  // module script 須在 global 上註冊 window.IGB_MODULE_<MODULEKEY>
  async function loadModule(moduleKey){
    moduleKey = normalize(moduleKey);
    const filename = `${moduleKey}.js`;
    const url = state.componentsPath + filename;
    try {
      await loadScript(url);
    } catch(err){
      log('fallback: trying kebab-case file name', moduleKey);
      // fallback try-kebab
      const kebab = moduleKey.replace(/_/g,'-');
      try {
        await loadScript(`${state.componentsPath}${kebab}.js`);
      } catch(err2){
        throw new Error(`Cannot load module scripts: ${url} or ${state.componentsPath}${kebab}.js`);
      }
    }

    // 匯入後要有全域變數 window.IGB_MODULE_<UPPER>
    const globalName = 'IGB_MODULE_' + moduleKey.toUpperCase();
    const moduleObj = global[globalName];

    if (!moduleObj || typeof moduleObj.init !== 'function'){
      throw new Error(`Module ${moduleKey} loaded but not registered as ${globalName} with init(container)`);
    }

    return { moduleKey, moduleObj };
  }

  // 切換模組
  async function switchModule(moduleKey){
    if(!moduleKey) return;
    const container = getContainer();
    container.innerHTML = '<div style="padding:24px">載入中…</div>';
    try {
      const loaded = await loadModule(moduleKey);
      // call init
      await Promise.resolve(loaded.moduleObj.init(container));
      state.current = moduleKey;
      // update nav active class (best-effort)
      document.querySelectorAll('.module-button').forEach(btn=>{
        btn.classList.toggle('active', btn.id === 'nav-' + (moduleKey.replace(/_/g,'-').replace(/-view$/,'')));
      });
      log('switched to', moduleKey);
    } catch(e){
      console.error('[auto_loader] switchModule error', e);
      container.innerHTML = `<div style="color:#d33; padding:20px">載入模組失敗：${e.message}</div>`;
    }
  }

  // public init
  function init(opts = {}){
    opts = opts || {};
    const defaultModule = opts.defaultModule || 'project_mgmt_module';
    if (opts.componentsPath) state.componentsPath = opts.componentsPath;
    if (opts.containerId) state.containerId = opts.containerId;
    // expose switchModule to global
    global.switchModule = switchModule;
    // expose autoLoader
    global.autoLoader = {
      init: init,
      loadModule,
      switchModule,
      state
    };

    // try default
    setTimeout(()=>{
      switchModule(defaultModule).catch(err=>{
        log('default module load failed', err);
      });
    }, 20);
  }

  // auto-register on script load if inline config provided (no-op)
  // finally export minimal API
  global.autoLoader = global.autoLoader || { init, switchModule, loadModule, state };

})(window);


