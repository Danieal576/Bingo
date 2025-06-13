
        // Game State
        let cartelas = [];
        let drawnNumbers = new Set();
        let currentGame = null;
        let games = JSON.parse(localStorage.getItem('bingoGames') || '[]');
        let customPattern = Array(5).fill().map(() => Array(5).fill(false));
        let lastClickedNumber = null;
        let isEditingPattern = true;
        const allNumbers = Array.from({length: 75}, (_, i) => i + 1);

        // Initialize the game
        function initializeGame() {
            initializeBingoBoard();
            initializePatternEditor();
            currentGame = new Game();
            updateRemainingNumbers();
        }

        // Bingo Board
        function initializeBingoBoard() {
            const ranges = [
                { letter: 'B', min: 1, max: 15 },
                { letter: 'I', min: 16, max: 30 },
                { letter: 'N', min: 31, max: 45 },
                { letter: 'G', min: 46, max: 60 },
                { letter: 'O', min: 61, max: 75 }
            ];

            const container = document.querySelector('.board-container');
            container.innerHTML = '';

            ranges.forEach(range => {
                const column = document.createElement('div');
                column.className = 'board-column';
                column.innerHTML = `<div class="board-header">${range.letter}</div><div class="board-cells"></div>`;
                
                const cellsDiv = column.querySelector('.board-cells');
                for (let num = range.min; num <= range.max; num++) {
                    const cell = document.createElement('div');
                    cell.className = 'board-cell';
                    cell.textContent = num;
                    cell.dataset.number = num;
                    cell.addEventListener('click', () => markNumber(num));
                    cell.addEventListener('dblclick', () => unmarkNumberOnBoard(num));
                    cellsDiv.appendChild(cell);
                }
                container.appendChild(column);
            });
        }

        function unmarkNumberOnBoard(number) {
            if (!drawnNumbers.has(number)) return;
            
            drawnNumbers.delete(number);
            
            document.querySelectorAll(`.board-cell[data-number="${number}"]`).forEach(cell => {
                cell.classList.remove('marked');
            });

            cartelas.forEach(cartela => {
                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 5; col++) {
                        if (cartela.grid[row][col] === number) {
                            cartela.marked[row][col] = false;
                        }
                    }
                }
                
                if (document.querySelector('#pattern-editor h3').textContent.includes(cartela.number)) {
                    displayCartelaInEditor(cartela);
                }
            });

            if (lastClickedNumber === number) {
                lastClickedNumber = Array.from(drawnNumbers).pop() || null;
                updateClickedNumbers();
            }

            updateRemainingNumbers();
        }

        function updateRemainingNumbers() {
            const remaining = allNumbers.filter(n => !drawnNumbers.has(n));
            document.getElementById('remaining-count').textContent = remaining.length;
        }

        // Pattern Editor
        function initializePatternEditor() {
            const grid = document.getElementById('pattern-grid');
            grid.innerHTML = '';

            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'editor-cell';
                    cell.dataset.row = row;
                    cell.dataset.col = col;
                    
                    if (row === 2 && col === 2) {
                        cell.textContent = 'FREE';
                        cell.classList.add('free-cell');
                    }
                    
                    if (isEditingPattern) {
                        cell.addEventListener('click', () => {
                            if (row !== 2 || col !== 2) {
                                customPattern[row][col] = !customPattern[row][col];
                                cell.classList.toggle('selected');
                            }
                        });
                    }
                    
                    grid.appendChild(cell);
                }
            }
        }

        function displayCartelaInEditor(cartela) {
            const grid = document.getElementById('pattern-grid');
            grid.innerHTML = '';

            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    const cell = document.createElement('div');
                    cell.className = `editor-cell display-mode ${cartela.marked[row][col] ? 'marked' : ''}`;
                    
                    if (row === 2 && col === 2) {
                        cell.textContent = 'FREE';
                        cell.classList.add('free-cell');
                    } else {
                        cell.textContent = cartela.grid[row][col];
                    }
                    
                    grid.appendChild(cell);
                }
            }
            
            document.querySelector('#pattern-editor h3').textContent = `🎨 Cartela #${cartela.number}`;
            isEditingPattern = false;
        }

        function switchToPatternEditor() {
            const grid = document.getElementById('pattern-grid');
            grid.innerHTML = '';

            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    const cell = document.createElement('div');
                    cell.className = `editor-cell ${customPattern[row][col] ? 'selected' : ''}`;
                    cell.dataset.row = row;
                    cell.dataset.col = col;
                    
                    if (row === 2 && col === 2) {
                        cell.textContent = 'FREE';
                        cell.classList.add('free-cell');
                    }
                    
                    cell.addEventListener('click', () => {
                        if (row !== 2 || col !== 2) {
                            customPattern[row][col] = !customPattern[row][col];
                            cell.classList.toggle('selected');
                        }
                    });
                    
                    grid.appendChild(cell);
                }
            }
            
            document.querySelector('#pattern-editor h3').textContent = '🎨 Pattern Editor';
            isEditingPattern = true;
        }

        function applyPattern() {
            if (currentGame) {
                currentGame.pattern = customPattern.map(row => [...row]);
                alert("Pattern applied to current game!");
            }
        }

        // Game Logic
        function markNumber(number) {
            if (drawnNumbers.has(number)) return;
            
            drawnNumbers.add(number);
            lastClickedNumber = number;
            updateClickedNumbers();

            document.querySelectorAll(`.board-cell[data-number="${number}"]`).forEach(cell => {
                cell.classList.add('marked');
            });

            cartelas.forEach(cartela => {
                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 5; col++) {
                        if (cartela.grid[row][col] === number) {
                            cartela.marked[row][col] = true;
                        }
                    }
                }
                
                if (document.querySelector('#pattern-editor h3').textContent.includes(cartela.number)) {
                    displayCartelaInEditor(cartela);
                }
                
                checkWin(cartela);
            });

            updateRemainingNumbers();
        }

        function checkWin(cartela) {
            if (!currentGame) return false;
            
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    if (currentGame.pattern[row][col] && !cartela.marked[row][col]) {
                        return false;
                    }
                }
            }
            
            alert(`Cartela ${cartela.number} wins!`);
            if (currentGame) {
                currentGame.endGame(cartela.number);
                currentGame = new Game();
            }
            return true;
        }

        function updateClickedNumbers() {
            document.querySelector('.numbers-list').textContent = lastClickedNumber || '-';
        }

        // Cartela Management
        function generateCartela(number) {
            const columns = [
                generateColumn(1, 15),
                generateColumn(16, 30),
                generateColumn(31, 45),
                generateColumn(46, 60),
                generateColumn(61, 75)
            ];

            const grid = columns[0].map((_, i) => columns.map(col => col[i]));
            grid[2][2] = 'FREE';
            
            return new Cartela(number, grid);
        }

        function generateColumn(min, max) {
            const nums = new Set();
            while (nums.size < 5) {
                nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
            }
            return Array.from(nums).sort((a, b) => a - b);
        }

        // Classes
        class Game {
            constructor() {
                this.number = games.length + 1;
                this.startTime = new Date();
                this.endTime = null;
                this.drawnNumbers = [];
                this.winner = null;
                this.duration = null;
                this.pattern = generateRandomPattern();
            }
            
            endGame(winner) {
                this.endTime = new Date();
                this.winner = winner;
                this.duration = this.endTime - this.startTime;
                games.push(this);
                localStorage.setItem('bingoGames', JSON.stringify(games));
            }
        }

        class Cartela {
            constructor(number, grid) {
                this.number = number;
                this.grid = grid;
                this.marked = Array(5).fill().map(() => Array(5).fill(false));
                this.marked[2][2] = true;
                
                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 5; col++) {
                        if (drawnNumbers.has(this.grid[row][col])) {
                            this.marked[row][col] = true;
                        }
                    }
                }
            }
        }

        function generateRandomPattern() {
            const pattern = Array(5).fill().map(() => Array(5).fill(false));
            pattern[2].fill(true);
            return pattern;
        }

        // Event Listeners
        document.getElementById('search-btn').addEventListener('click', () => {
            const number = document.getElementById('search-input').value.trim();
            if (!number) return;

            let cartela = cartelas.find(c => c.number === number);
            if (!cartela) {
                cartela = generateCartela(number);
                cartelas.push(cartela);
            }
            displayCartelaInEditor(cartela);
            document.getElementById('search-input').value = '';
        });

        document.getElementById('new-game-btn').addEventListener('click', () => {
            currentGame = new Game();
            drawnNumbers.clear();
            lastClickedNumber = null;
            cartelas = [];
            document.querySelectorAll('.board-cell').forEach(cell => cell.classList.remove('marked'));
            updateClickedNumbers();
            updateRemainingNumbers();
            switchToPatternEditor();
        });

        document.getElementById('apply-pattern-btn').addEventListener('click', applyPattern);
        document.getElementById('edit-pattern-btn').addEventListener('click', switchToPatternEditor);

        // Initialize the game
        initializeGame();
    