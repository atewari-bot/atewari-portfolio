export type Project = {
  title: string
  description: string
  tags: string[]
  icon: string
  href: string | null
  githubHref?: string
}

export const projects: Project[] = [
  {
    title: 'Drone Image Classification',
    description:
      'Computer vision system that detects drones, helicopters, airplanes, and birds in aerial imagery. Achieves 98.25% accuracy with an optimized Random Forest (500 trees) and 90.5% spatial localization via Fast R-CNN — trained on 2,100 samples across 4 classes.',
    tags: ['Python', 'TensorFlow', 'OpenCV', 'scikit-learn', 'CNN', 'Computer Vision'],
    icon: '🛸',
    href: 'https://github.com/atewari-bot/drone-image-classification',
  },
  {
    title: 'Vehicle Value Prediction',
    description:
      'Regression models predicting used car prices across 390k listings using 8 algorithms. XGBRegressor achieved R² of 0.87 (RMSE $4,498); top price drivers: vehicle age (41%), odometer (31%), model type (23%).',
    tags: ['Python', 'XGBoost', 'scikit-learn', 'pandas', 'Regression'],
    icon: '🚗',
    href: 'https://github.com/atewari-bot/vehicle-value-prediction',
  },
  {
    title: 'Bank Marketing Campaign',
    description:
      'Classification models predicting client subscription to bank deposits from 79k telemarketing contacts. Achieved AUC 0.94 with Logistic Regression; boosted recall from 0.43 → 0.91 via SMOTE on a heavily imbalanced dataset (8% positive class).',
    tags: ['Python', 'scikit-learn', 'SMOTE', 'Classification', 'EDA'],
    icon: '🏦',
    href: 'https://github.com/atewari-bot/bank-marketing-campaign',
  },
  {
    title: 'Driving Coupon Analysis',
    description:
      'EDA of coupon acceptance patterns across 12k+ driving scenarios. Identified key acceptance drivers — carry-out coupons hit 73.55% vs. 41% for bars — segmented by demographics, weather, visit frequency, and time of day.',
    tags: ['Python', 'pandas', 'matplotlib', 'seaborn', 'EDA'],
    icon: '🎟️',
    href: 'https://github.com/atewari-bot/driving-coupon',
  },
  {
    title: 'Regression Analysis',
    description:
      'Interactive Streamlit app for end-to-end regression analysis — EDA, model fitting, and result visualization through a modular UI. Supports containerized development via devcontainer configuration.',
    tags: ['Python', 'Streamlit', 'Regression', 'EDA'],
    icon: '📊',
    href: 'https://regression-analysis-racubeai.streamlit.app/',
    githubHref: 'https://github.com/atewari-bot/regression-analysis',
  },
  {
    title: 'Gradient Descent Visualizer',
    description:
      'Interactive visualization of the gradient descent algorithm on a quadratic function f(x) = x². Adjustable learning rate, iteration count, and starting point with real-time convergence path rendered as connected steps.',
    tags: ['Python', 'Optimization', 'Machine Learning'],
    icon: '📉',
    href: 'https://gd-racubeai.streamlit.app/',
    githubHref: 'https://github.com/atewari-bot/gradient-descent',
  },
]
