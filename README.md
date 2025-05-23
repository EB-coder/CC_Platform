# CC_Platform

CC_Platform is a comprehensive web-based competitive coding platform designed to automatically evaluate code submissions for programming problems. It integrates OpenAI's API to provide intelligent feedback on code structure, logic, and efficiency.

## 🚀 Features

- **User Authentication**: Secure login and registration system with admin privileges
- **Task Management**: Create, edit, and manage coding challenges with difficulty levels
- **Code Submission Interface**: Users can submit their solutions through a user-friendly web interface
- **Automated Evaluation**: Submissions are analyzed using OpenAI's API to assess correctness, efficiency, and coding practices
- **Feedback Reports**: Detailed feedback is provided to help users improve their solutions
- **Admin Panel**: Comprehensive admin dashboard to manage tasks, users, and submissions
- **User Management**: Admin can view and edit user accounts and credentials
- **Profile System**: User profiles with task completion tracking and difficulty filtering
- **Solution Viewing**: Browse and view submitted solutions with detailed feedback
- **Responsive Design**: Modern, minimalistic UI that works on all devices

## 🛠️ Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **AI Integration**: OpenAI API
- **Authentication**: JWT tokens
- **Version Control**: Git

## 🔧 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/EB-coder/CC_Platform.git
   cd CC_Platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the server directory and add:
   ```env
   OPENAI_API_KEY=your_api_key_here
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=cf_platform
   DB_PASSWORD=your_password
   DB_PORT=5432
   JWT_SECRET=your_secret_key
   ```

4. **Set up PostgreSQL Database:**
   - Install PostgreSQL
   - Create a database named `cf_platform`
   - Run the database schema setup

5. **Start the server:**
   ```bash
   cd server
   node server.js
   ```

6. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

## 📄 Usage

- **Register/Login**: Create an account or sign in to access the platform
- **Browse Tasks**: View available coding challenges with different difficulty levels
- **Submit Solutions**: Write and submit your code solutions
- **Receive Feedback**: Get AI-powered feedback on your submissions
- **Track Progress**: Monitor your completed tasks and performance
- **Admin Features**: Manage tasks, users, and platform content (admin only)

## 🎨 Design Features

- **Matrix Animation**: Dynamic background with falling binary code
- **Minimalistic UI**: Clean, professional interface design
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Dark/Light Themes**: Adaptive color schemes
- **Smooth Animations**: Fluid transitions and interactions

## 📌 Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your enhancements.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
