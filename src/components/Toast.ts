'use client'

export function showToast(message: string) {
  try {
    const containerId = 'toast-container'
    let container = document.getElementById(containerId)
    if (!container) {
      container = document.createElement('div')
      container.id = containerId
      container.style.position = 'fixed'
      container.style.top = '16px'
      container.style.right = '16px'
      container.style.zIndex = '9999'
      document.body.appendChild(container)
    }
    const toast = document.createElement('div')
    toast.className = 'toast-item'
    toast.textContent = message
    container.appendChild(toast)
    setTimeout(() => {
      toast.classList.add('toast-out')
      setTimeout(() => toast.remove(), 160)
    }, 3000)
  } catch {}
}

export function showMessageToast(data: { fanName: string; fanAvatar?: string; text: string }) {
  try {
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 backdrop-blur-xl bg-white/95 shadow-xl rounded-2xl p-4 max-w-sm animate-toastIn border border-gray-100 ring-1 ring-black/5'
    const avatar = data.fanAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fanName)}&background=gradient`
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <img src="${avatar}" alt="${data.fanName}" class="w-10 h-10 rounded-xl shadow-sm" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900">${data.fanName}</p>
          <p class="text-sm text-gray-700 truncate">${data.text}</p>
        </div>
        <button class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200" onclick="this.parentElement.parentElement.remove()" aria-label="Close notification">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.classList.replace('animate-toastIn', 'animate-toastOut')
      setTimeout(() => toast.remove(), 160)
    }, 5000)
  } catch {}
}