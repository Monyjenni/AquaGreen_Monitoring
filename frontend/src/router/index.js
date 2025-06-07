import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import FilesView from '../views/FilesView.vue'
import FileDetailView from '../views/FileDetailView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import store from '../store'
import GeneticDataUploader from '../components/GeneticDataUploader.vue'
import UploadPortal from '../views/UploadPortal.vue'

const routes = [
  {
    path: '/',
    name: 'root',
    redirect: '/dashboard' // Always redirect to dashboard for development
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/upload',
    name: 'upload-portal',
    component: UploadPortal,
    meta: { requiresAuth: true }
  },
  {
    path: '/upload-greenhouse',
    name: 'upload-greenhouse',
    component: () => import('../views/UploadView.vue'),
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
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guest: true }
  },
  {
    path: '/signup',
    name: 'signup',
    component: RegisterView,
    meta: { guest: true }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/ForgotPasswordView.vue'),
    meta: { guest: true }
  },
  {
    path: '/reset-password/:uid/:token',
    name: 'reset-password',
    component: () => import('../views/ResetPasswordView.vue'),
    meta: { guest: true }
  },
  {
    path: '/reset-password-direct/:email',
    name: 'reset-password-direct',
    component: () => import('../views/ResetPasswordView.vue'),
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
  },
  {
    path: '/genetic-data',
    name: 'genetic-data',
    component: GeneticDataUploader,
    meta: { requiresAuth: true }
  },
  {
    path: '/genetic-data-management',
    name: 'genetic-data-management',
    component: () => import('../views/GeneticDataView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated
  
  // Handle root path redirection (now handled by root route config)
  // if (to.path === '/') {
  //   if (isAuthenticated) {
  //     next({ name: 'dashboard' })
  //   } else {
  //     next({ name: 'login' })
  //   }
  //   return
  // }
  
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
      next({ name: 'dashboard' })
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
