class EliteMediaArchive {
    constructor() {
        this.mediaItems = JSON.parse(localStorage.getItem('eliteMediaArchive')) || [];
        this.currentFilter = 'all';
        this.selectedFiles = [];
        this.userRole = null;
        this.loginTime = null;
        this.sessionTimer = null;
        
        // Photo viewer state
        this.currentPhotoIndex = 0;
        this.currentPhotos = [];
        
        this.passwords = {
            viewer: 'втораяротачепельсынбляди',
            admin: '563489'
        };
        
        this.initializeElements();
        this.bindEvents();
        this.checkAuthentication();
    }

    initializeElements() {
        // Welcome elements
        this.welcomeSection = document.getElementById('welcomeSection');
        this.enterBtn = document.getElementById('enterBtn');
        
        // Auth elements
        this.authSection = document.getElementById('authSection');
        this.backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
        this.authError = document.getElementById('authError');
        this.accessCards = document.querySelectorAll('.access-card');
        
        // Agreement elements
        this.agreementSection = document.getElementById('agreementSection');
        this.agreeCheckbox = document.getElementById('agreeCheckbox');
        this.agreeBtn = document.getElementById('agreeBtn');
        this.backToAuthBtn = document.getElementById('backToAuthBtn');
        
        // Cut scene elements
        this.cutScene = document.getElementById('cutScene');
        this.codeOutput = document.getElementById('codeOutput');
        this.cursor = document.getElementById('cursor');
        this.accessGranted = document.getElementById('accessGranted');
        
        // App elements
        this.mainApp = document.getElementById('mainApp');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userBadge = document.getElementById('userBadge');
        this.userRoleElement = document.getElementById('userRole');
        this.loginTimeElement = document.getElementById('loginTime');
        this.sessionDurationElement = document.getElementById('sessionDuration');
        
        // Navigation
        this.navBtns = document.querySelectorAll('.nav-btn');
        this.uploadTrigger = document.getElementById('uploadTrigger');
        this.emptyUploadBtn = document.getElementById('emptyUploadBtn');
        
        // Upload
        this.uploadSection = document.getElementById('uploadSection');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.closeUpload = document.getElementById('closeUpload');
        this.processUpload = document.getElementById('processUpload');
        this.fileInfo = document.getElementById('fileInfo');
        
        // Gallery
        this.galleryGrid = document.getElementById('galleryGrid');
        this.emptyState = document.getElementById('emptyState');
        this.galleryTitle = document.getElementById('galleryTitle');
        this.fileCount = document.getElementById('fileCount');
        
        // Photo Viewer elements
        this.photoViewer = document.getElementById('photoViewer');
        this.viewerOverlay = document.getElementById('viewerOverlay');
        this.viewerClose = document.getElementById('viewerClose');
        this.viewerPrev = document.getElementById('viewerPrev');
        this.viewerNext = document.getElementById('viewerNext');
        this.viewerImage = document.getElementById('viewerImage');
        this.viewerTitle = document.getElementById('viewerTitle');
        this.viewerMeta = document.getElementById('viewerMeta');
        this.viewerCounter = document.getElementById('viewerCounter');
    }

    bindEvents() {
        // Welcome events
        this.enterBtn.addEventListener('click', () => {
            this.showAuthSection();
        });

        // Auth events
        this.backToWelcomeBtn.addEventListener('click', () => {
            this.showWelcomeSection();
        });

        this.accessCards.forEach(card => {
            const authBtn = card.querySelector('.auth-btn');
            const passwordInput = card.querySelector('.password-input input');
            
            authBtn.addEventListener('click', () => {
                const level = card.dataset.level;
                this.authenticate(level, passwordInput.value);
            });
            
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const level = card.dataset.level;
                    this.authenticate(level, e.target.value);
                }
            });
        });

        // Agreement events
        this.agreeCheckbox.addEventListener('change', () => {
            this.agreeBtn.disabled = !this.agreeCheckbox.checked;
        });
        
        this.agreeBtn.addEventListener('click', () => {
            this.acceptAgreement();
        });

        this.backToAuthBtn.addEventListener('click', () => {
            this.showAuthSection();
        });

        // App controls
        this.logoutBtn.addEventListener('click', () => this.logout());
        this.uploadTrigger.addEventListener('click', () => this.toggleUploadSection());
        this.emptyUploadBtn.addEventListener('click', () => this.toggleUploadSection());
        this.closeUpload.addEventListener('click', () => this.toggleUploadSection());

        // Navigation
        this.navBtns.forEach(btn => {
            if (!btn.classList.contains('upload-trigger')) {
                btn.addEventListener('click', (e) => {
                    const filter = e.currentTarget.dataset.filter;
                    this.setActiveFilter(filter);
                });
            }
        });

        // File handling
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.processUpload.addEventListener('click', this.processUploadFiles.bind(this));

        // Photo Viewer events
        this.viewerClose.addEventListener('click', () => this.closePhotoViewer());
        this.viewerOverlay.addEventListener('click', () => this.closePhotoViewer());
        this.viewerPrev.addEventListener('click', () => this.showPreviousPhoto());
        this.viewerNext.addEventListener('click', () => this.showNextPhoto());
        
        // Keyboard navigation for photo viewer
        document.addEventListener('keydown', (e) => {
            if (!this.photoViewer.classList.contains('hidden')) {
                if (e.key === 'Escape') {
                    this.closePhotoViewer();
                } else if (e.key === 'ArrowLeft') {
                    this.showPreviousPhoto();
                } else if (e.key === 'ArrowRight') {
                    this.showNextPhoto();
                }
            }
        });
    }

    // Photo Viewer Methods
    openPhotoViewer(photoIndex, photos) {
        this.currentPhotoIndex = photoIndex;
        this.currentPhotos = photos;
        this.showPhoto();
        this.photoViewer.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closePhotoViewer() {
        this.photoViewer.classList.add('hidden');
        document.body.style.overflow = '';
        this.currentPhotos = [];
    }

    showPhoto() {
        if (this.currentPhotos.length === 0) return;
        
        const photo = this.currentPhotos[this.currentPhotoIndex];
        this.viewerImage.src = photo.url;
        this.viewerTitle.textContent = photo.name;
        this.viewerMeta.textContent = `${photo.size} • ${photo.uploadDate} ${photo.uploadTime}`;
        this.viewerCounter.textContent = `${this.currentPhotoIndex + 1} / ${this.currentPhotos.length}`;
        
        // Update navigation buttons state
        this.viewerPrev.style.display = this.currentPhotoIndex > 0 ? 'flex' : 'none';
        this.viewerNext.style.display = this.currentPhotoIndex < this.currentPhotos.length - 1 ? 'flex' : 'none';
    }

    showNextPhoto() {
        if (this.currentPhotoIndex < this.currentPhotos.length - 1) {
            this.currentPhotoIndex++;
            this.showPhoto();
        }
    }

    showPreviousPhoto() {
        if (this.currentPhotoIndex > 0) {
            this.currentPhotoIndex--;
            this.showPhoto();
        }
    }

    // Остальные методы остаются без изменений...
    checkAuthentication() {
        const savedAuth = localStorage.getItem('eliteArchiveAuth');
        const agreementAccepted = localStorage.getItem('eliteArchiveAgreement');
        
        if (savedAuth && agreementAccepted) {
            const authData = JSON.parse(savedAuth);
            this.userRole = authData.role;
            this.loginTime = new Date(authData.timestamp);
            this.showMainApp();
            this.startSessionTimer();
        } else {
            this.showWelcomeSection();
        }
    }

    showWelcomeSection() {
        this.hideAllSections();
        this.welcomeSection.classList.remove('hidden');
    }

    showAuthSection() {
        this.hideAllSections();
        this.authSection.classList.remove('hidden');
        this.clearAuthInputs();
        this.authError.textContent = '';
    }

    showAgreementSection() {
        this.hideAllSections();
        this.agreementSection.classList.remove('hidden');
        this.agreeCheckbox.checked = false;
        this.agreeBtn.disabled = true;
    }

    hideAllSections() {
        const sections = [
            this.welcomeSection,
            this.authSection,
            this.agreementSection,
            this.cutScene,
            this.mainApp,
            this.photoViewer
        ];
        
        sections.forEach(section => {
            if (section) section.classList.add('hidden');
        });
    }

    authenticate(level, password) {
        const correctPassword = this.passwords[level];
        
        if (password === correctPassword) {
            this.userRole = level;
            this.showAgreementSection();
            this.clearAuthInputs();
            this.authError.textContent = '';
        } else {
            this.authError.textContent = 'Неверный пароль доступа!';
            this.shakeAuthInput(level);
        }
    }

    acceptAgreement() {
        localStorage.setItem('eliteArchiveAgreement', 'true');
        this.startCutScene();
    }

    startCutScene() {
        this.hideAllSections();
        this.cutScene.classList.remove('hidden');
        this.typeCodeSequence();
    }

    typeCodeSequence() {
        const codeLines = [
            "> Инициализация системы безопасности...",
            "[OK] Загрузка модуля аутентификации",
            "[OK] Проверка цифровых сертификатов",
            "[OK] Инициализация криптографических ключей",
            "",
            "> Проверка соглашения о конфиденциальности...",
            "[INFO] Проверка принятых пользователем условий",
            "[OK] Соглашение подтверждено и зарегистрировано",
            "[OK] Юридическая сила активирована",
            "",
            "> Активация системы мониторинга...",
            "[INFO] Запуск поведенческого анализа",
            "[OK] Система распознавания лиц активирована",
            "[OK] Запись сессии начата",
            "[OK] Контроль сетевой активности установлен",
            "",
            "> Запуск протокола безопасного соединения...",
            "[INFO] Установка TLS 1.3 соединения",
            "[OK] Обмен ключами по алгоритму ECDHE",
            "[OK] Верификация сертификата центра сертификации",
            "",
            "> Анализ учетных данных пользователя...",
            "[DEBUG] Хэш пароля: **********",
            "[DEBUG] Соль: 0x1a2b3c4d5e6f",
            "[OK] Проверка хэша SHA-256 пройдена",
            "[OK] Учетные данные верифицированы",
            "",
            "> Загрузка модуля контроля доступа...",
            "[INFO] Инициализация RBAC системы",
            "[DEBUG] Уровень доступа: " + (this.userRole === 'admin' ? 'ROOT' : 'USER'),
            "[OK] Права доступа установлены",
            "",
            "> Подключение к защищенному хранилищу...",
            "[INFO] Инициализация AES-256-GCM",
            "[OK] Шифрование данных активировано",
            "[OK] Подключение к базе данных установлено",
            "",
            "> Проверка целостности системы...",
            "[INFO] Сканирование системных файлов",
            "[OK] Целостность ядра подтверждена",
            "[OK] Проверка цифровых подписей пройдена",
            "[OK] Антивирусная защита активирована",
            "",
            "> Мониторинг сетевой активности...",
            "[INFO] Запуск IDS/IPS системы",
            "[OK] Обнаружение вторжений активно",
            "[OK] Файрволл настроен и работает",
            "[OK] VPN туннель установлен",
            "",
            "> Инициализация пользовательской сессии...",
            "[INFO] Генерация сессионного токена",
            "[DEBUG] Session ID: " + this.generateSessionId(),
            "[OK] Токен безопасности создан",
            "[OK] Время жизни сессии: 24 часа",
            "",
            "> Финальная проверка системы...",
            "[INFO] Тестирование подсистем безопасности",
            "[OK] Все системы работают в штатном режиме",
            "[OK] Готовность к работе: 100%",
            "",
            "████████████████████████████████████████",
            "█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█",
            "█░░░░░░░░░░ СИСТЕМА ГОТОВА ░░░░░░░░░░░█",
            "█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█",
            "████████████████████████████████████████",
            "",
            "> Запуск пользовательского интерфейса..."
        ];

        let currentLine = 0;
        
        const typeNextLine = () => {
            if (currentLine < codeLines.length) {
                const line = codeLines[currentLine];
                if (line.trim() === '') {
                    this.addCodeLine('<br>');
                } else {
                    const formattedLine = this.formatCodeLine(line);
                    this.addCodeLine(formattedLine);
                }
                currentLine++;
                setTimeout(typeNextLine, this.getTypingSpeed(line));
            } else {
                setTimeout(() => {
                    this.showAccessGranted();
                }, 1000);
            }
        };

        typeNextLine();
    }

    formatCodeLine(line) {
        if (line.includes('[OK]')) {
            return `<span class="code-line"><span class="keyword">[OK]</span> ${line.replace('[OK] ', '')}</span>`;
        } else if (line.includes('[INFO]')) {
            return `<span class="code-line"><span class="function">[INFO]</span> ${line.replace('[INFO] ', '')}</span>`;
        } else if (line.includes('[DEBUG]')) {
            return `<span class="code-line"><span class="variable">[DEBUG]</span> ${line.replace('[DEBUG] ', '')}</span>`;
        } else if (line.includes('>')) {
            return `<span class="code-line"><span class="string">${line}</span></span>`;
        } else if (line.includes('█')) {
            return `<span class="code-line"><span class="number">${line}</span></span>`;
        } else {
            return `<span class="code-line">${line}</span>`;
        }
    }

    addCodeLine(html) {
        const line = document.createElement('div');
        line.innerHTML = html;
        this.codeOutput.appendChild(line);
        this.codeOutput.scrollTop = this.codeOutput.scrollHeight;
    }

    getTypingSpeed(line) {
        if (line.includes('█')) return 50;
        if (line.includes('[OK]') || line.includes('[INFO]')) return 80;
        if (line.trim() === '') return 200;
        return Math.random() * 100 + 50;
    }

    generateSessionId() {
        return 'SESSION_' + Math.random().toString(36).substr(2, 16).toUpperCase();
    }

    showAccessGranted() {
        this.cursor.style.display = 'none';
        this.accessGranted.classList.remove('hidden');
        
        this.createMatrixEffect();
        
        setTimeout(() => {
            this.completeCutScene();
        }, 4000);
    }

    createMatrixEffect() {
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createMatrixChar(chars);
            }, i * 100);
        }
    }

    createMatrixChar(chars) {
        const char = document.createElement('div');
        char.className = 'matrix-char';
        char.textContent = chars.charAt(Math.floor(Math.random() * chars.length));
        char.style.left = Math.random() * 100 + 'vw';
        char.style.animationDuration = (Math.random() * 3 + 2) + 's';
        char.style.opacity = Math.random() * 0.5 + 0.5;
        
        this.accessGranted.appendChild(char);
        
        setTimeout(() => {
            char.remove();
        }, 5000);
    }

    completeCutScene() {
        this.loginTime = new Date();
        localStorage.setItem('eliteArchiveAuth', JSON.stringify({
            role: this.userRole,
            timestamp: this.loginTime.getTime()
        }));
        
        this.cutScene.classList.add('hidden');
        this.showMainApp();
        this.startSessionTimer();
    }

    clearAuthInputs() {
        document.querySelectorAll('.password-input input').forEach(input => {
            input.value = '';
        });
    }

    shakeAuthInput(level) {
        const input = document.querySelector(`.access-card[data-level="${level}"] .password-input input`);
        input.style.animation = 'shake 0.5s';
        input.value = '';
        setTimeout(() => {
            input.style.animation = '';
            input.focus();
        }, 500);
    }

    logout() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        this.userRole = null;
        this.loginTime = null;
        localStorage.removeItem('eliteArchiveAuth');
        localStorage.removeItem('eliteArchiveAgreement');
        this.showWelcomeSection();
    }

    showMainApp() {
        this.hideAllSections();
        this.mainApp.classList.remove('hidden');
        
        this.updateUserInterface();
        this.renderGallery();
    }

    updateUserInterface() {
        const roleText = this.userRole === 'admin' ? 'Администратор' : 'Просмотр';
        this.userRoleElement.textContent = roleText;
        
        if (this.userRole === 'viewer') {
            this.uploadTrigger.style.display = 'none';
            this.emptyUploadBtn.style.display = 'none';
        } else {
            this.uploadTrigger.style.display = 'flex';
            this.emptyUploadBtn.style.display = 'flex';
        }
    }

    startSessionTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        this.sessionTimer = setInterval(() => {
            this.updateSessionDuration();
        }, 1000);
        
        this.updateSessionDuration();
    }

    updateSessionDuration() {
        if (!this.loginTime) return;
        
        const now = new Date();
        const diff = Math.floor((now - this.loginTime) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.sessionDurationElement) {
            this.sessionDurationElement.textContent = formattedTime;
        }
        
        if (this.loginTimeElement) {
            this.loginTimeElement.textContent = `Вход: ${this.loginTime.toLocaleTimeString('ru-RU')}`;
        }
    }

    setActiveFilter(filter) {
        this.currentFilter = filter;
        
        this.navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        const titles = {
            all: 'Все материалы',
            image: 'Фотографии',
            video: 'Видеозаписи'
        };
        this.galleryTitle.textContent = titles[filter];
        
        this.renderGallery();
    }

    toggleUploadSection() {
        if (this.userRole !== 'admin') {
            this.showError('Только администраторы могут загружать файлы');
            return;
        }
        
        this.uploadSection.classList.toggle('hidden');
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        this.selectedFiles = Array.from(e.dataTransfer.files);
        this.showSelectedFiles();
    }

    handleFileSelect(e) {
        this.selectedFiles = Array.from(e.target.files);
        this.showSelectedFiles();
    }

    showSelectedFiles() {
        if (this.selectedFiles.length > 0) {
            const totalSize = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
            this.fileInfo.textContent = `${this.selectedFiles.length} файлов · ${this.formatFileSize(totalSize)}`;
            
            this.uploadArea.innerHTML = `
                <div class="upload-content">
                    <i class="fas fa-check-circle" style="color: #27ae60;"></i>
                    <h4>Готово к загрузке</h4>
                    <p>${this.selectedFiles.length} файлов выбрано</p>
                    <span class="file-types">${this.selectedFiles.slice(0, 3).map(f => f.name).join(', ')}${this.selectedFiles.length > 3 ? '...' : ''}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            `;
        }
    }

    async processUploadFiles() {
        if (this.userRole !== 'admin') {
            this.showError('Только администраторы могут загружать файлы');
            return;
        }

        if (this.selectedFiles.length === 0) {
            this.showError('Пожалуйста, выберите файлы для загрузки');
            return;
        }

        const progressBar = this.createProgressBar();
        
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            await this.uploadFile(file, i);
            
            const progress = ((i + 1) / this.selectedFiles.length) * 100;
            progressBar.update(progress);
        }

        this.resetUploadForm();
        progressBar.complete();
        this.toggleUploadSection();
        this.renderGallery();
    }

    createProgressBar() {
        const progressBar = this.uploadArea.querySelector('.progress-bar');
        const progressFill = this.uploadArea.querySelector('.progress-fill');
        progressBar.style.display = 'block';

        return {
            update: (percent) => {
                progressFill.style.width = percent + '%';
            },
            complete: () => {
                setTimeout(() => {
                    progressBar.style.display = 'none';
                    progressFill.style.width = '0%';
                }, 1000);
            }
        };
    }

    uploadFile(file, index) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const mediaItem = {
                        id: Date.now() + index,
                        name: file.name,
                        type: file.type.startsWith('image/') ? 'image' : 'video',
                        url: e.target.result,
                        size: this.formatFileSize(file.size),
                        uploadDate: new Date().toLocaleDateString('ru-RU'),
                        uploadTime: new Date().toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })
                    };
                    
                    this.mediaItems.unshift(mediaItem);
                    this.saveToLocalStorage();
                    resolve();
                };
                
                if (file.type.startsWith('image/')) {
                    reader.readAsDataURL(file);
                } else {
                    const videoUrl = URL.createObjectURL(file);
                    const mediaItem = {
                        id: Date.now() + index,
                        name: file.name,
                        type: 'video',
                        url: videoUrl,
                        size: this.formatFileSize(file.size),
                        uploadDate: new Date().toLocaleDateString('ru-RU'),
                        uploadTime: new Date().toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })
                    };
                    
                    this.mediaItems.unshift(mediaItem);
                    this.saveToLocalStorage();
                    resolve();
                }
            }, 500 + Math.random() * 1000);
        });
    }

    resetUploadForm() {
        this.selectedFiles = [];
        this.fileInput.value = '';
        this.fileInfo.textContent = '';
        
        this.uploadArea.innerHTML = `
            <div class="upload-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <h4>Перетащите файлы сюда</h4>
                <p>или нажмите для выбора</p>
                <span class="file-types">JPG, PNG, MP4, AVI</span>
            </div>
            <input type="file" id="fileInput" class="file-input" multiple accept="image/*,video/*">
        `;
        
        this.fileInput = document.getElementById('fileInput');
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    renderGallery() {
        const filteredItems = this.currentFilter === 'all' 
            ? this.mediaItems 
            : this.mediaItems.filter(item => item.type === this.currentFilter);

        this.fileCount.textContent = `${filteredItems.length} файлов`;

        if (filteredItems.length === 0) {
            this.galleryGrid.style.display = 'none';
            this.emptyState.style.display = 'block';
            return;
        }

        this.galleryGrid.style.display = 'grid';
        this.emptyState.style.display = 'none';

        this.galleryGrid.innerHTML = filteredItems.map((item, index) => `
            <div class="media-item" data-id="${item.id}">
                ${this.userRole === 'admin' ? `
                <div class="media-actions">
                    <button class="action-btn download" title="Скачать файл">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn delete" title="Удалить файл">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ` : ''}
                ${item.type === 'image' 
                    ? `<img src="${item.url}" alt="${item.name}" loading="lazy" data-index="${index}">`
                    : `<video controls preload="metadata">
                         <source src="${item.url}" type="video/mp4">
                         Ваш браузер не поддерживает видео.
                       </video>`
                }
                <div class="media-type">
                    <i class="fas fa-${item.type === 'image' ? 'camera' : 'film'}"></i>
                    ${item.type === 'image' ? 'Фото' : 'Видео'}
                </div>
                <div class="media-info">
                    <h4>${item.name}</h4>
                    <div class="media-meta">
                        <span>${item.size}</span>
                        <span>${item.uploadDate}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners for action buttons (admin only)
        if (this.userRole === 'admin') {
            this.galleryGrid.querySelectorAll('.delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const itemId = parseInt(btn.closest('.media-item').dataset.id);
                    this.deleteMediaItem(itemId);
                });
            });

            this.galleryGrid.querySelectorAll('.download').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const itemId = parseInt(btn.closest('.media-item').dataset.id);
                    this.downloadMediaItem(itemId);
                });
            });
        }

        // Add click event for images to open photo viewer
        this.galleryGrid.querySelectorAll('img').forEach((img, index) => {
            img.addEventListener('click', () => {
                const photos = filteredItems.filter(item => item.type === 'image');
                const photoIndex = photos.findIndex(photo => 
                    photo.url === img.src
                );
                if (photoIndex !== -1) {
                    this.openPhotoViewer(photoIndex, photos);
                }
            });
        });
    }

    deleteMediaItem(id) {
        if (this.userRole !== 'admin') {
            this.showError('Только администраторы могут удалять файлы');
            return;
        }

        if (confirm('Вы уверены, что хотите удалить этот файл?')) {
            this.mediaItems = this.mediaItems.filter(item => item.id !== id);
            this.saveToLocalStorage();
            this.renderGallery();
        }
    }

    downloadMediaItem(id) {
        if (this.userRole !== 'admin') {
            this.showError('Только администраторы могут скачивать файлы');
            return;
        }

        const item = this.mediaItems.find(item => item.id === id);
        if (!item) return;

        const link = document.createElement('a');
        link.href = item.url;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showError(message) {
        this.authError.textContent = message;
        setTimeout(() => {
            this.authError.textContent = '';
        }, 3000);
    }

    saveToLocalStorage() {
        localStorage.setItem('eliteMediaArchive', JSON.stringify(this.mediaItems));
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new EliteMediaArchive();
});