export default defineAppConfig({
  pages: [
    'pages/auth/index',
    'pages/dashboard/index',
    'pages/workout-log/index'
  ],
  window: {
    navigationBarTitleText: 'FitGenius',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
    backgroundTextStyle: 'light'
  }
});
