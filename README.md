CF_coding
CF_coding is a web-based platform designed to automatically evaluate code submissions for competitive programming problems. It integrates OpenAI's API to provide intelligent feedback on code structure, logic, and efficiency.​

🚀 Features
Code Submission Interface: Users can submit their solutions through a user-friendly web interface.

Automated Evaluation: Submissions are analyzed using OpenAI's API to assess correctness, efficiency, and coding practices.

Feedback Reports: Detailed feedback is provided to help users improve their solutions.

Admin Panel: Administrators can manage submissions and monitor evaluations.​

🛠️ Technology Stack
Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express.js

AI Integration: OpenAI API

Version Control: Git​

📁 Project Structure
csharp
Копировать
Редактировать
CF_coding/
├── public/             # Static frontend files
│   ├── index.html      # Main interface
│   ├── styles.css      # Styling
│   └── script.js       # Frontend logic
├── server/             # Backend server code
│   └── server.js       # Express server setup
├── .gitignore          # Git ignore file
├── package.json        # Node.js project metadata
└── README.md           # Project documentation
🔧 Installation & Setup
Clone the repository:

bash
Копировать
Редактировать
git clone https://github.com/EB-coder/CF_coding.git
cd CF_coding
Install dependencies:

bash
Копировать
Редактировать
npm install
Configure OpenAI API Key:

Create a .env file in the root directory.

Add your OpenAI API key:

ini
Копировать
Редактировать
OPENAI_API_KEY=your_api_key_here
Start the server:

bash
Копировать
Редактировать
node server/server.js
Access the application:

Open your browser and navigate to http://localhost:3000​
Medium

📄 Usage
Submit Code: Enter your solution in the provided text area and submit.

Receive Feedback: The system will process your code and display feedback regarding its correctness and efficiency.

Iterate: Use the feedback to improve your solution and resubmit as needed.​

📌 Contributing
Contributions are welcome! Please fork the repository and submit a pull request with your enhancements.​

📜 License
This project is licensed under the MIT License.
