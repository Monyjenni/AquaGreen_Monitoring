import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UploadView from '../views/UploadView.vue'
import FilesView from '../views/FilesView.vue'
import FileDetailView from '../views/FileDetailView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import store from '../store'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/upload',
    name: 'upload',
    component: UploadView,
    meta: { requiresAuth: true }
  },
  {
    path: '/files',
    name: 'files',
    component: FilesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/files/:id',
    name: 'file-detail',
    component: FileDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/crop-images',
    name: 'crop-images',
    component: () => import('../views/CropImagesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/crop-images/:id',
    name: 'crop-image-detail',
    component: () => import('../views/CropImageDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/csv-files',
    name: 'csv-files',
    component: () => import('../views/CsvFilesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guest: true }
  },
  {
    path: '/signup',
    name: 'register',
    component: RegisterView,
    meta: { guest: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/visualizations',
    name: 'visualizations',
    component: () => import('../views/DataVisualizationView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated
  
  // Redirect root path to login if not authenticated
  if (to.path === '/' && !isAuthenticated) {
    next({ name: 'login' })
    return
  }
  
  // Route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next({ name: 'login' })
    } else {
      next()
    }
  } 
  // Route is for guests only (like login, register)
  else if (to.matched.some(record => record.meta.guest)) {
    if (isAuthenticated) {
      next({ name: 'home' })
    } else {
      next()
    }
  } 
  // Public route
  else {
    next()
  }
})

export default router
