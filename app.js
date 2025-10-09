// 全局变量
let vocabularyData = []; // 存储从Excel读取的词汇数据
let currentQuizData = []; // 当前测验的题目数据
let wrongWords = []; // 存储错题
let currentQuestionIndex = 0; // 当前题目的索引
let correctCount = 0; // 答对的题目数量
let language = localStorage.getItem('preferredLanguage') || 'zh'; // 默认语言为中文，优先从localStorage读取
let questionCount = 10; // 默认题目数量
let currentAnswerDisplayed = []; // 当前已显示的答案部分
let answerWords = []; // 当前答案的单词数组
let currentLineDisplayStatus = null; // 当前行显示状态

// DOM元素
const mainContainer = document.getElementById('main-container');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const languageSelect = document.getElementById('language');
const questionCountSelect = document.getElementById('question-count');
const startQuizBtn = document.getElementById('start-quiz');
const exitQuizBtn = document.getElementById('exit-quiz');
const peekAnswerBtn = document.getElementById('peek-answer');
const showAnswerBtn = document.getElementById('show-answer');
const correctAnswerBtn = document.getElementById('correct-answer');
const wrongAnswerBtn = document.getElementById('wrong-answer');
const backToMainBtn = document.getElementById('back-to-main');
const restartQuizBtn = document.getElementById('restart-quiz');
const reportErrorBtn = document.getElementById('report-error');
const shareVocabBtn = document.getElementById('share-vocab');
const suggestImprovementBtn = document.getElementById('suggest-improvement');

// 语言翻译对象
const translations = {
    zh: {
        appTitle: '英语魔法书',
        languageLabel: '语言 / Language:',
        statsTitle: '学习统计',
        visitsTitle: '访问量',
        completedTitle: '完成题目',
        startQuizTitle: '开始测验',
        questionCountLabel: '选择题数:',
        startQuizBtn: '开始测验',
        contactTitle: '反馈与建议',
        reportErrorBtn: '语料库纠错',
        shareVocabBtn: '分享新题库',
        suggestImprovementBtn: '用户体验优化',
        quizTitle: '词汇测验',
        exitBtn: '退出',
        questionTitle: '中文释义',
        answerTitle: '英文答案',
        peekAnswerBtn: '瞄一眼',
        showAnswerBtn: '揭晓答案',
        correctAnswerBtn: '我答对了！',
        wrongAnswerBtn: '不认识',
        resultTitle: '测验完成！',
        scoreText: '得分: ',
        backToMainBtn: '返回',
        restartQuizBtn: '重新测验',
        wrongWordsTitle: '错题本',
        chineseHeader: '中文',
        englishHeader: '英文',
        congratulations: '恭喜你！',
        keepTrying: '继续努力！'
    },
    en: {
        appTitle: 'English Magic Book',
        languageLabel: 'Language / 语言:',
        statsTitle: 'Study Statistics',
        visitsTitle: 'Visits',
        completedTitle: 'Completed Questions',
        startQuizTitle: 'Start Quiz',
        questionCountLabel: 'Select Questions:',
        startQuizBtn: 'Start Quiz',
        contactTitle: 'Feedback & Suggestions',
        reportErrorBtn: 'Report Errors',
        shareVocabBtn: 'Share Vocabulary',
        suggestImprovementBtn: 'Suggest Improvements',
        quizTitle: 'Vocabulary Quiz',
        exitBtn: 'Exit',
        questionTitle: 'Chinese Definition',
        answerTitle: 'English Answer',
        peekAnswerBtn: 'Peek',
        showAnswerBtn: 'Show Answer',
        correctAnswerBtn: 'I Got It!',
        wrongAnswerBtn: 'Don\'t Know',
        resultTitle: 'Quiz Completed!',
        scoreText: 'Score: ',
        backToMainBtn: 'Back',
        restartQuizBtn: 'Restart Quiz',
        wrongWordsTitle: 'Wrong Words',
        chineseHeader: 'Chinese',
        englishHeader: 'English',
        congratulations: 'Congratulations!',
        keepTrying: 'Keep Trying!'
    }
};

// 初始化应用
function initApp() {
    // 加载Excel文件
    loadExcelFile();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化图表
    initCharts();
}

// 加载CSV文件（默认语料库）
function loadExcelFile() {
    try {
        // 尝试直接加载项目中的CSV文件
        fetch('Scopus.csv')
            .then(response => {
                if (!response.ok) {
                    throw new Error('无法加载CSV文件');
                }
                return response.text();
            })
            .then(text => {
                try {
                    // 解析CSV文本
                    const processedData = parseCSV(text);
                    
                    if (processedData.length > 0) {
                        vocabularyData = processedData;
                        console.log(`成功加载${processedData.length}条词汇记录！`);
                    } else {
                        console.warn('未能从文件中读取有效词汇数据，使用模拟数据');
                        useMockData();
                    }
                } catch (error) {
                    console.error('解析CSV文件时出错:', error);
                    console.warn('使用模拟数据作为备选');
                    useMockData();
                }
            })
            .catch(error => {
                console.error('加载CSV文件时出错:', error);
                console.warn('使用模拟数据作为备选');
                useMockData();
            });
        
        // 创建一个隐藏的文件上传按钮，允许用户上传自己的词汇表文件
        createFileUploadButton();
        
    } catch (error) {
        console.error('加载CSV文件时出错:', error);
        
        // 显示错误消息给用户
        alert(language === 'zh' ? '加载词汇数据时出错，请刷新页面重试。' : 'Error loading vocabulary data. Please refresh the page and try again.');
    }
}

// 解析CSV文件
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const data = [];
    
    // 跳过标题行
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            // 使用逗号分割，注意处理引号内的逗号
            const columns = parseCSVLine(line);
            if (columns.length >= 2) {
                // 检查是否包含"每当……"格式，如果是则直接使用
                let chineseValue = columns[1].trim();
                let englishValue = columns[0].trim();
                
                // 确保正确处理用户要求的格式："每当……"作为键，英文表达作为值
                data.push({
                    chinese: chineseValue,  // 直接使用第二列作为中文键（包含"每当……"）
                    english: englishValue   // 直接使用第一列作为英文值
                });
            }
        }
    }
    
    return data;
}

// 解析CSV单行，处理引号内的逗号
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    
    // 去除引号
    return result.map(item => {
        if (item.startsWith('"') && item.endsWith('"')) {
            return item.slice(1, -1).replace(/""/g, '"');
        }
        return item;
    });
}

// 使用模拟数据
function useMockData() {
    // 准备一组更丰富的模拟数据作为备选
    const mockData = [
        { chinese: '关心sb\n为（琐事）烦恼\n小题大做', english: 'fuss over sb\nfuss about sth\nmake a fuss' },
        { chinese: '允许sb做', english: 'allow sb to do\nlicense sb to do\npermit sb to do' },
        { chinese: '担心，挂念', english: 'worry about\nbe concerned about' },
        { chinese: '擅长，精通', english: 'be good at\nexcel at\nbe skilled in' },
        { chinese: '与...相处融洽', english: 'get along well with\nbe on good terms with' },
        { chinese: '导致，引起', english: 'lead to\nresult in\ncause' },
        { chinese: '依赖，依靠', english: 'depend on\nrely on\ncount on' },
        { chinese: '照顾，照料', english: 'take care of\nlook after\ncare for' },
        { chinese: '参与，参加', english: 'participate in\ntake part in\njoin in' },
        { chinese: '专注于', english: 'focus on\nconcentrate on\nbe absorbed in' },
        { chinese: '对...感兴趣', english: 'be interested in\nhave an interest in\ntake an interest in' },
        { chinese: '习惯于', english: 'be used to\nbe accustomed to\nget used to' },
        { chinese: '与...相比', english: 'compared with\nin comparison with\nas compared to' },
        { chinese: '由于，因为', english: 'because of\ndue to\nowing to' },
        { chinese: '与...交流', english: 'communicate with\ninteract with\ntalk with' },
        { chinese: '处理，解决', english: 'deal with\nhandle\ntackle' },
        { chinese: '从...中学习', english: 'learn from\ntake lessons from\ndraw lessons from' },
        { chinese: '属于', english: 'belong to\nbe part of\nbe a member of' },
        { chinese: '期待，盼望', english: 'look forward to\nexpect\nanticipate' },
        { chinese: '放弃', english: 'give up\nquit\nabandon' },
        { chinese: '继续', english: 'continue\nproceed\ncarry on' },
        { chinese: '成功', english: 'succeed\nachieve success\nbe successful' },
        { chinese: '失败', english: 'fail\nbe unsuccessful\nmeet with failure' },
        { chinese: '努力', english: 'work hard\make efforts\nstruggle' },
        { chinese: '休息', english: 'rest\ntake a break\nrelax' },
        { chinese: '学习', english: 'study\nlearn\nacquire knowledge' },
        { chinese: '教导', english: 'teach\ninstruct\neducate' },
        { chinese: '理解', english: 'understand\ngrasp\ncomprehend' },
        { chinese: '忘记', english: 'forget\nlose one\'s memory of\nbe unable to remember' },
        { chinese: '记得', english: 'remember\nrecall\nkeep in mind' },
        { chinese: '喜欢', english: 'like\nenjoy\nbe fond of' },
        { chinese: '讨厌', english: 'hate\ndislike\nbe厌恶of' },
        { chinese: '爱', english: 'love\nbe in love with\ncherish' },
        { chinese: '恨', english: 'hate\nresent\nbear a grudge against' },
        { chinese: '快乐', english: 'happy\njoyful\npleased' },
        { chinese: '悲伤', english: 'sad\nsorrowful\nunhappy' },
        { chinese: '生气', english: 'angry\nfurious\nannoyed' },
        { chinese: '害怕', english: 'afraid\nfearful\nscared' },
        { chinese: '勇敢', english: 'brave\ncourageous\nfearless' },
        { chinese: '胆小', english: 'cowardly\n timid\nfearful' }
    ];
    
    // 使用模拟数据
    vocabularyData = mockData;
    
    console.log('使用模拟词汇数据，共', vocabularyData.length, '条记录');
}

// 创建文件上传按钮
function createFileUploadButton() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls, .csv';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleFileUpload);
    
    document.body.appendChild(fileInput);
    
    // 创建加号按钮
    const uploadButton = document.createElement('div');
    uploadButton.className = 'upload-button';
    uploadButton.textContent = '+';
    uploadButton.title = language === 'zh' ? '上传词汇表' : 'Upload Vocabulary';
    uploadButton.style.position = 'fixed';
    uploadButton.style.bottom = '20px';
    uploadButton.style.right = '20px';
    uploadButton.style.background = 'rgba(255, 107, 139, 0.9)';
    uploadButton.style.color = 'white';
    uploadButton.style.width = '50px';
    uploadButton.style.height = '50px';
    uploadButton.style.borderRadius = '50%';
    uploadButton.style.cursor = 'pointer';
    uploadButton.style.zIndex = '1000';
    uploadButton.style.display = 'flex';
    uploadButton.style.alignItems = 'center';
    uploadButton.style.justifyContent = 'center';
    uploadButton.style.fontSize = '2rem';
    uploadButton.style.boxShadow = '0 4px 12px rgba(255, 107, 139, 0.3)';
    uploadButton.style.transition = 'all 0.3s ease';
    uploadButton.addEventListener('click', () => fileInput.click());
    
    // 添加悬浮效果
    uploadButton.addEventListener('mouseover', function() {
        this.style.background = 'rgba(255, 107, 139, 1)';
        this.style.transform = 'scale(1.1)';
    });
    
    uploadButton.addEventListener('mouseout', function() {
        this.style.background = 'rgba(255, 107, 139, 0.9)';
        this.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(uploadButton);
}

// 处理文件上传
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 将工作表转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // 处理数据格式（确保中文作为键，英文作为值）
            const processedData = jsonData.map(row => {
                // 获取第一列和第二列的值
                const keys = Object.keys(row);
                if (keys.length >= 2) {
                    return {
                        chinese: row[keys[1]] || '', // 第二列作为中文键（包含"每当……"）
                        english: row[keys[0]] || ''  // 第一列作为英文值
                    };
                }
                return null;
            }).filter(item => item !== null && item.chinese && item.english);
            
            if (processedData.length > 0) {
                vocabularyData = processedData;
                alert(language === 'zh' ? `成功加载${processedData.length}条词汇记录！` : `Successfully loaded ${processedData.length} vocabulary records!`);
            } else {
                alert(language === 'zh' ? '未能从文件中读取有效词汇数据，请检查文件格式。' : 'Failed to read valid vocabulary data from the file. Please check the file format.');
            }
        } catch (error) {
            console.error('解析文件时出错:', error);
            alert(language === 'zh' ? '解析文件时出错，请检查文件格式是否正确。' : 'Error parsing the file. Please check if the file format is correct.');
        }
    };
    reader.readAsArrayBuffer(file);
}

// 设置事件监听器
function setupEventListeners() {
    // 语言切换
    languageSelect.value = language; // 设置初始语言选择
    languageSelect.addEventListener('change', () => {
        language = languageSelect.value;
        localStorage.setItem('preferredLanguage', language); // 保存用户语言偏好
        updateLanguage();
        updateWrongWordsTable(); // 更新表格的data-label属性
    });
    
    // 题目数量选择
    questionCountSelect.addEventListener('change', () => {
        questionCount = parseInt(questionCountSelect.value);
    });
    
    // 开始测验
    startQuizBtn.addEventListener('click', startQuiz);
    
    // 退出测验
    exitQuizBtn.addEventListener('click', exitQuiz);
    
    // 瞄一眼答案
    peekAnswerBtn.addEventListener('click', peekAnswer);
    
    // 揭晓答案
    showAnswerBtn.addEventListener('click', showAnswer);
    
    // 答对了
    correctAnswerBtn.addEventListener('click', handleCorrectAnswer);
    
    // 不认识
    wrongAnswerBtn.addEventListener('click', handleWrongAnswer);
    
    // 返回主界面
    backToMainBtn.addEventListener('click', exitQuiz);
    
    // 重新测验
    restartQuizBtn.addEventListener('click', restartQuiz);
    
    // 邮件联系按钮
    reportErrorBtn.addEventListener('click', () => window.location.href = 'mailto:sifansong432@qq.com?subject=【语料库纠错】');
    shareVocabBtn.addEventListener('click', () => window.location.href = 'mailto:sifansong432@qq.com?subject=【分享新题库】&body=请在附件中添加CSV/XLSX格式的词汇表，一列中文一列英文。');
    suggestImprovementBtn.addEventListener('click', () => window.location.href = 'mailto:sifansong432@qq.com?subject=【用户体验优化】');
}

// 更新语言显示
function updateLanguage() {
    const t = translations[language];
    
    // 首先使用翻译对象中的值更新所有元素
    document.querySelector('.app-title').textContent = t.appTitle;
    document.querySelector('.language-selector label').textContent = t.languageLabel;
    document.querySelector('.stats-section h2').textContent = t.statsTitle;
    document.querySelector('#visitsChart').closest('.chart-wrapper').querySelector('h3').textContent = t.visitsTitle;
    document.querySelector('#completedChart').closest('.chart-wrapper').querySelector('h3').textContent = t.completedTitle;
    document.querySelector('.quiz-settings h2').textContent = t.startQuizTitle;
    document.querySelector('.settings-options label').textContent = t.questionCountLabel;
    document.querySelector('.contact-section h2').textContent = t.contactTitle;
    
    // 更新所有按钮文本
    startQuizBtn.textContent = t.startQuizBtn;
    reportErrorBtn.textContent = t.reportErrorBtn;
    shareVocabBtn.textContent = t.shareVocabBtn;
    suggestImprovementBtn.textContent = t.suggestImprovementBtn;
    peekAnswerBtn.textContent = t.peekAnswerBtn;
    showAnswerBtn.textContent = t.showAnswerBtn;
    correctAnswerBtn.textContent = t.correctAnswerBtn;
    wrongAnswerBtn.textContent = t.wrongAnswerBtn;
    exitQuizBtn.textContent = t.exitBtn;
    backToMainBtn.textContent = t.backToMainBtn;
    restartQuizBtn.textContent = t.restartQuizBtn;
    
    // 更新其他标题文本
    if (document.getElementById('quiz-title')) {
        document.getElementById('quiz-title').textContent = t.quizTitle;
    }
    if (document.getElementById('question-title')) {
        document.getElementById('question-title').textContent = t.questionTitle;
    }
    if (document.getElementById('answer-title')) {
        document.getElementById('answer-title').textContent = t.answerTitle;
    }
    if (document.getElementById('result-title')) {
        document.getElementById('result-title').textContent = t.resultTitle;
    }
    if (document.getElementById('wrong-words-title')) {
        document.getElementById('wrong-words-title').textContent = t.wrongWordsTitle;
    }
    
    // 更新表格头部
    const tableHeaders = document.querySelectorAll('#wrong-words-table th');
    if (tableHeaders.length >= 2) {
        tableHeaders[0].textContent = t.chineseHeader;
        tableHeaders[1].textContent = t.englishHeader;
    }
    
    // 特别处理：在English版中，确保某些文本完全使用英文
    if (language === 'en') {
        document.querySelector('.language-selector label').textContent = 'Language:';
        document.querySelector('.settings-options label').textContent = 'Select Questions:';
        
        // 确保进度文本也是英文
        if (document.getElementById('question-number') && document.getElementById('total-questions')) {
            const currentQuestion = currentQuestionIndex + 1;
            const totalQuestions = currentQuizData.length;
            if (totalQuestions > 0) {
                document.getElementById('question-number').textContent = `Question ${currentQuestion}`;
                document.getElementById('total-questions').textContent = `/${totalQuestions}`;
            }
        }
    }
}

// 初始化图表（不显示伪造数据）
function initCharts() {
    // 不显示任何模拟数据的图表
    console.log('图表初始化：不显示伪造的统计数据');
}

// 开始测验
function startQuiz() {
    try {
        console.log('开始测验按钮被点击');
        console.log('当前词汇数据量:', vocabularyData.length);
        
        // 检查词汇数据是否为空
        if (vocabularyData.length === 0) {
            console.error('词汇数据为空，无法开始测验');
            alert(language === 'zh' ? '词汇数据加载失败，请刷新页面重试。' : 'Vocabulary data failed to load. Please refresh the page and try again.');
            return;
        }
        
        // 从词汇库中随机抽取题目
        currentQuizData = [];
        const shuffledData = [...vocabularyData].sort(() => 0.5 - Math.random());
        
        // 确保有足够的题目
        const actualQuestionCount = Math.min(questionCount, shuffledData.length);
        currentQuizData = shuffledData.slice(0, actualQuestionCount);
        
        console.log(`已抽取 ${actualQuestionCount} 道题目`);
        
        // 重置状态
        currentQuestionIndex = 0;
        correctCount = 0;
        wrongWords = [];
        
        // 显示测验界面
        console.log('切换到测验界面');
        mainContainer.style.display = 'none';
        quizContainer.style.display = 'block';
        resultContainer.style.display = 'none';
        
        // 加载第一题
        loadQuestion();
        
    } catch (error) {
        console.error('开始测验过程中出错:', error);
        alert(language === 'zh' ? '开始测验失败，请刷新页面重试。' : 'Failed to start the quiz. Please refresh the page and try again.');
    }
}

// 加载题目
function loadQuestion() {
    if (currentQuestionIndex >= currentQuizData.length) {
        showResults();
        return;
    }
    
    const question = currentQuizData[currentQuestionIndex];
    
    // 显示中文释义 - 直接使用题目对象中的'每当……'作为键
    document.getElementById('chinese-definition').textContent = question.chinese;
    
    // 清空答案区域
    document.getElementById('english-answer').textContent = '';
    
    // 重置答案显示状态
    currentAnswerDisplayed = null;
    answerWords = [];
    currentLineDisplayStatus = null;
    
    // 更新进度
    document.getElementById('question-number').textContent = language === 'zh' ? `第 ${currentQuestionIndex + 1} 题` : `Question ${currentQuestionIndex + 1}`;
    document.getElementById('total-questions').textContent = language === 'zh' ? `/ ${currentQuizData.length} 题` : `/ ${currentQuizData.length}`;
    
    // 重置按钮状态
    peekAnswerBtn.disabled = false;
    showAnswerBtn.disabled = false;
    correctAnswerBtn.disabled = true;
    wrongAnswerBtn.disabled = true;
}

// 瞄一眼答案 - 严格逐词提示
function peekAnswer() {
    const question = currentQuizData[currentQuestionIndex];
    
    // 初始化答案单词显示状态
    if (!currentAnswerDisplayed) {
        currentAnswerDisplayed = [];
        // 解析所有单词
        answerWords = [];
        const allWords = question.english.split(/\s+/);
        allWords.forEach(word => {
            if (word.trim()) {
                answerWords.push(word);
            }
        });
    }
    
    // 检查是否还有未显示的单词
    if (currentAnswerDisplayed.length >= answerWords.length) {
        return;
    }
    
    // 添加下一个单词
    currentAnswerDisplayed.push(answerWords[currentAnswerDisplayed.length]);
    
    // 构建显示的答案文本，严格逐词显示
    let displayText = '';
    const originalLines = question.english.split('\n');
    let wordIndex = 0;
    
    originalLines.forEach((line, lineIndex) => {
        const wordsInLine = line.trim().split(/\s+/).filter(w => w.trim());
        const lineWords = [];
        
        // 逐词处理当前行
        wordsInLine.forEach(word => {
            if (wordIndex < currentAnswerDisplayed.length && word === currentAnswerDisplayed[wordIndex]) {
                lineWords.push(word);
                wordIndex++;
            } else {
                // 未显示的单词用下划线占位符表示
                lineWords.push('____');
            }
        });
        
        // 添加当前行到显示文本，保留原始的换行结构
        displayText += lineWords.join(' ') + '\n';
    });
    
    // 移除最后一个换行符
    displayText = displayText.trim();
    
    // 更新答案显示
    document.getElementById('english-answer').textContent = displayText;
    
    // 如果所有单词都已显示
    if (currentAnswerDisplayed.length >= answerWords.length) {
        peekAnswerBtn.disabled = true;
        showAnswerBtn.disabled = true;
        correctAnswerBtn.disabled = false;
        wrongAnswerBtn.disabled = false;
    }
}

// 揭晓答案
function showAnswer() {
    // 显示完整答案
    document.getElementById('english-answer').textContent = currentQuizData[currentQuestionIndex].english;
    
    // 更新按钮状态
    peekAnswerBtn.disabled = true;
    showAnswerBtn.disabled = true;
    correctAnswerBtn.disabled = false;
    wrongAnswerBtn.disabled = false;
}

// 处理答对情况
function handleCorrectAnswer() {
    correctCount++;
    currentQuestionIndex++;
    loadQuestion();
}

// 处理答错情况
function handleWrongAnswer() {
    // 将当前题目添加到错题本
    wrongWords.push(currentQuizData[currentQuestionIndex]);
    currentQuestionIndex++;
    loadQuestion();
}

// 显示测验结果
function showResults() {
    // 计算得分
    const score = Math.round((correctCount / currentQuizData.length) * 100);
    
    // 更新结果界面
    document.getElementById('score-text').textContent = translations[language].scoreText + score + '/' + 100;
    
    // 设置结果图片
    const resultImage = document.getElementById('result-image');
    if (score >= 90) {
        resultImage.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23ffd6dc\'/%3E%3Ctext x=\'50\' y=\'55\' font-family=\'Arial\' font-size=\'12\' text-anchor=\'middle\' fill=\'%23ff6b8b\'%3E' + translations[language].congratulations + '%3C/text%3E%3Ctext x=\'50\' y=\'68\' font-family=\'Arial\' font-size=\'16\' font-weight=\'bold\' text-anchor=\'middle\' fill=\'%23ff6b8b\'%3E' + score + '/100%3C/text%3E%3C/svg%3E")';
    } else {
        resultImage.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23e3f2fd\'/%3E%3Ctext x=\'50\' y=\'55\' font-family=\'Arial\' font-size=\'12\' text-anchor=\'middle\' fill=\'%231976d2\'%3E' + translations[language].keepTrying + '%3C/text%3E%3Ctext x=\'50\' y=\'68\' font-family=\'Arial\' font-size=\'16\' font-weight=\'bold\' text-anchor=\'middle\' fill=\'%231976d2\'%3E' + score + '/100%3C/text%3E%3C/svg%3E")';
    }
    
    // 更新错题本
    updateWrongWordsTable();
    
    // 显示结果界面
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
}

// 更新错题本表格
function updateWrongWordsTable() {
    const tableBody = document.querySelector('#wrong-words-table tbody');
    tableBody.innerHTML = '';
    
    if (wrongWords.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 2;
        cell.textContent = language === 'zh' ? '太棒了！没有错题！' : 'Great! No wrong words!';
        cell.style.textAlign = 'center';
        cell.setAttribute('data-label', language === 'zh' ? '状态' : 'Status');
        row.appendChild(cell);
        tableBody.appendChild(row);
    } else {
        wrongWords.forEach(word => {
            const row = document.createElement('tr');
            
            const chineseCell = document.createElement('td');
            chineseCell.textContent = word.chinese;
            chineseCell.setAttribute('data-label', translations[language].chineseHeader);
            
            const englishCell = document.createElement('td');
            englishCell.textContent = word.english;
            englishCell.setAttribute('data-label', translations[language].englishHeader);
            
            row.appendChild(chineseCell);
            row.appendChild(englishCell);
            tableBody.appendChild(row);
        });
    }
}

// 退出测验
function exitQuiz() {
    resultContainer.style.display = 'none';
    quizContainer.style.display = 'none';
    mainContainer.style.display = 'block';
}

// 重新测验
function restartQuiz() {
    // 打乱当前测验的题目顺序
    currentQuizData.sort(() => 0.5 - Math.random());
    
    // 重置状态
    currentQuestionIndex = 0;
    correctCount = 0;
    wrongWords = [];
    
    // 显示测验界面
    resultContainer.style.display = 'none';
    quizContainer.style.display = 'block';
    
    // 加载第一题
    loadQuestion();
}

// 检查DOM元素是否正确加载
function checkDOMElements() {
    const elements = [
        { name: 'mainContainer', element: mainContainer },
        { name: 'quizContainer', element: quizContainer },
        { name: 'resultContainer', element: resultContainer },
        { name: 'languageSelect', element: languageSelect },
        { name: 'questionCountSelect', element: questionCountSelect },
        { name: 'startQuizBtn', element: startQuizBtn },
        { name: 'exitQuizBtn', element: exitQuizBtn },
        { name: 'peekAnswerBtn', element: peekAnswerBtn },
        { name: 'showAnswerBtn', element: showAnswerBtn },
        { name: 'correctAnswerBtn', element: correctAnswerBtn },
        { name: 'wrongAnswerBtn', element: wrongAnswerBtn },
        { name: 'backToMainBtn', element: backToMainBtn },
        { name: 'restartQuizBtn', element: restartQuizBtn },
        { name: 'reportErrorBtn', element: reportErrorBtn },
        { name: 'shareVocabBtn', element: shareVocabBtn },
        { name: 'suggestImprovementBtn', element: suggestImprovementBtn }
    ];
    
    elements.forEach(item => {
        if (!item.element) {
            console.warn(`警告: DOM元素 ${item.name} 未找到`);
        } else {
            console.log(`DOM元素 ${item.name} 已成功加载`);
        }
    });
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM已加载完成，开始初始化应用...');
    
    try {
        // 检查DOM元素是否正确加载
        checkDOMElements();
        
        // 初始化应用
        initApp();
        
        console.log('应用初始化完成');
    } catch (error) {
        console.error('应用初始化过程中出错:', error);
        alert(language === 'zh' ? '应用初始化失败，请刷新页面重试。' : 'Application initialization failed. Please refresh the page and try again.');
    }
});