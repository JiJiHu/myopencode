    
        // Canvas setup
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // Game state
        let gameState = 'menu'; // menu, playing, paused, gameover
        let difficulty = 'hard';
        let animationId = null;
        
        // Grid settings
        const GRID_SIZE = 12;
        let CELL_SIZE = 40;
        
        // Game variables
        let gold = 500;
        let lives = 20;
        let wave = 1;
        let enemiesKilled = 0;
        let selectedTowerType = null;
        let selectedTower = null;
        let showRange = false;
        let rangePosition = null;
        
        // Entities
        let towers = [];
        let enemies = [];
        let projectiles = [];
        let particles = [];
        let waveInProgress = false;
        let enemiesToSpawn = [];
        let spawnTimer = 0;
        let gameTime = 0;
        
        // Path definition (grid coordinates)
        let path = [];
        
        // Difficulty settings - EXTREME MODE
        const difficultySettings = {
            easy: { initialGold: 600, enemyHealthMult: 0.8, enemySpeedMult: 0.9 },
            medium: { initialGold: 500, enemyHealthMult: 1.0, enemySpeedMult: 1.0 },
            hard: { initialGold: 200, enemyHealthMult: 2.5, enemySpeedMult: 1.8 }
        };
        
        // Tower types
        const towerTypes = {
            rapid: {
                name: '机关炮塔',
                icon: '🔫',
                cost: 50,
                damage: 8,
                range: 2.5,
                fireRate: 8, // shots per second
                color: '#3498db',
                projectileSpeed: 8,
                description: '快速射击，单体伤害'
            },
            cannon: {
                name: '加农炮塔',
                icon: '💣',
                cost: 100,
                damage: 25,
                range: 2,
                fireRate: 1.5,
                color: '#e74c3c',
                projectileSpeed: 5,
                splashRadius: 1.5,
                description: '范围伤害，爆炸效果'
            },
            ice: {
                name: '寒冰塔',
                icon: '❄️',
                cost: 80,
                damage: 3,
                range: 2.5,
                fireRate: 2,
                color: '#00ced1',
                projectileSpeed: 6,
                slowFactor: 0.5,
                slowDuration: 120,
                description: '减速敌人，辅助控制'
            },
            laser: {
                name: '激光塔',
                icon: '⚡',
                cost: 150,
                damage: 5,
                range: 4,
                fireRate: 10,
                color: '#9b59b6',
                projectileSpeed: 20,
                pierce: true,
                description: '穿透攻击，远程输出'
            },
            gold: {
                name: '金币塔',
                icon: '💎',
                cost: 200,
                damage: 0,
                range: 0,
                fireRate: 0,
                color: '#ffd700',
                goldGeneration: 15,
                goldInterval: 180, // frames
                description: '定期产生金币'
            }
        };
        
        // Enemy types - EXTREME DIFFICULTY
        const enemyTypes = {
            normal: {
                name: '普通海盗',
                health: 60,
                speed: 2.5,
                reward: 5,
                color: '#e74c3c',
                radius: 12
            },
            fast: {
                name: '快速海盗',
                health: 30,
                speed: 4.0,
                reward: 8,
                color: '#f39c12',
                radius: 10
            },
            tank: {
                name: '重装海盗',
                health: 200,
                speed: 1.2,
                reward: 15,
                color: '#8e44ad',
                radius: 15
            },
            flying: {
                name: '飞行海盗',
                health: 50,
                speed: 3.5,
                reward: 12,
                color: '#3498db',
                radius: 11,
                flying: true
            },
            boss: {
                name: '海盗船长',
                health: 800,
                speed: 1.0,
                reward: 50,
                color: '#c0392b',
                radius: 20,
                boss: true
            }
        };
        
        // Wave configurations
        function generateWave(waveNum) {
            const waves = [];
            const diff = difficultySettings[difficulty];
            
            // Normal waves
            if (waveNum % 5 !== 0) {
                const enemyCount = 5 + waveNum * 2;
                for (let i = 0; i < enemyCount; i++) {
                    if (waveNum >= 3 && i % 5 === 0) {
                        waves.push('fast');
                    } else if (waveNum >= 5 && i % 7 === 0) {
                        waves.push('tank');
                    } else if (waveNum >= 7 && i % 10 === 0) {
                        waves.push('flying');
                    } else {
                        waves.push('normal');
                    }
                }
            } else {
                // Boss wave every 5 waves
                waves.push('boss');
                for (let i = 0; i < 5 + waveNum; i++) {
                    waves.push('normal');
                }
                waves.push('boss');
            }
            
            return waves;
        }
        
        // Initialize path
        function initPath() {
            // Create a winding path through the grid
            path = [
                {x: 0, y: 2},
                {x: 3, y: 2},
                {x: 3, y: 6},
                {x: 7, y: 6},
                {x: 7, y: 3},
                {x: 10, y: 3},
                {x: 10, y: 8},
                {x: 5, y: 8},
                {x: 5, y: 10},
                {x: 11, y: 10}
            ];
        }
        
        // Resize canvas
        function resizeCanvas() {
            const container = document.getElementById('gameContainer');
            const maxWidth = Math.min(800, container.clientWidth - 20);
            const maxHeight = Math.min(600, window.innerHeight - 200);
            
            const size = Math.min(maxWidth, maxHeight);
            CELL_SIZE = Math.floor(size / GRID_SIZE);
            
            canvas.width = CELL_SIZE * GRID_SIZE;
            canvas.height = CELL_SIZE * GRID_SIZE;
        }
        
        // Grid coordinates to pixel coordinates
        function gridToPixel(gx, gy) {
            return {
                x: gx * CELL_SIZE + CELL_SIZE / 2,
                y: gy * CELL_SIZE + CELL_SIZE / 2
            };
        }
        
        // Pixel coordinates to grid coordinates
        function pixelToGrid(px, py) {
            return {
                x: Math.floor(px / CELL_SIZE),
                y: Math.floor(py / CELL_SIZE)
            };
        }
        
        // Check if position is on path
        function isPath(gx, gy) {
            for (let i = 0; i < path.length - 1; i++) {
                const p1 = path[i];
                const p2 = path[i + 1];
                
                // Check if point is on this path segment
                if (p1.x === p2.x) {
                    // Vertical segment
                    if (gx === p1.x && gy >= Math.min(p1.y, p2.y) && gy <= Math.max(p1.y, p2.y)) {
                        return true;
                    }
                } else if (p1.y === p2.y) {
                    // Horizontal segment
                    if (gy === p1.y && gx >= Math.min(p1.x, p2.x) && gx <= Math.max(p1.x, p2.x)) {
                        return true;
                    }
                }
            }
            return false;
        }
        
        // Check if tower exists at position
        function getTowerAt(gx, gy) {
            return towers.find(t => t.gridX === gx && t.gridY === gy);
        }
        
        // Can place tower at position
        function canPlaceTower(gx, gy) {
            if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return false;
            if (isPath(gx, gy)) return false;
            if (getTowerAt(gx, gy)) return false;
            return true;
        }
        
        // Create enemy
        function createEnemy(type) {
            const enemyType = enemyTypes[type];
            const diff = difficultySettings[difficulty];
            const startPos = gridToPixel(path[0].x, path[0].y);
            
            return {
                type: type,
                x: startPos.x,
                y: startPos.y,
                gridX: path[0].x,
                gridY: path[0].y,
                pathIndex: 0,
                health: enemyType.health * diff.enemyHealthMult * (1 + (wave - 1) * 0.15),
                maxHealth: enemyType.health * diff.enemyHealthMult * (1 + (wave - 1) * 0.15),
                speed: enemyType.speed * diff.enemySpeedMult * CELL_SIZE / 60,
                reward: enemyType.reward,
                color: enemyType.color,
                radius: enemyType.radius * (CELL_SIZE / 40),
                flying: enemyType.flying || false,
                boss: enemyType.boss || false,
                slowTimer: 0,
                frozen: false,
                effects: []
            };
        }
        
        // Create projectile
        function createProjectile(tower, target, targetX, targetY) {
            const tType = towerTypes[tower.type];
            const angle = Math.atan2(targetY - tower.y, targetX - tower.x);
            
            return {
                x: tower.x,
                y: tower.y,
                vx: Math.cos(angle) * tType.projectileSpeed * (CELL_SIZE / 40),
                vy: Math.sin(angle) * tType.projectileSpeed * (CELL_SIZE / 40),
                damage: tType.damage * tower.level,
                speed: tType.projectileSpeed,
                color: tType.color,
                target: target,
                type: tower.type,
                splashRadius: tType.splashRadius || 0,
                slowFactor: tType.slowFactor || 0,
                slowDuration: tType.slowDuration || 0,
                pierce: tType.pierce || false,
                pierced: []
            };
        }
        
        // Create particle
        function createParticles(x, y, color, count = 5) {
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count;
                particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * (Math.random() * 2 + 1),
                    vy: Math.sin(angle) * (Math.random() * 2 + 1),
                    life: 30 + Math.random() * 20,
                    maxLife: 30 + Math.random() * 20,
                    color: color,
                    size: Math.random() * 4 + 2
                });
            }
        }
        
        // Create floating text
        function createFloatingText(x, y, text, color) {
            particles.push({
                x: x,
                y: y,
                vx: 0,
                vy: -1,
                life: 40,
                maxLife: 40,
                text: text,
                color: color,
                isText: true
            });
        }
        
        // Start wave
        function startWave() {
            if (waveInProgress) return;
            
            enemiesToSpawn = generateWave(wave);
            waveInProgress = true;
            spawnTimer = 0;
            document.getElementById('nextWaveBtn').classList.remove('show');
        }

        // Show wave announcement
        function showWaveAnnouncement(waveNum) {
            const announcement = document.createElement('div');
            announcement.className = 'wave-announcement';
            announcement.innerHTML = `
                <div class="wave-content">
                    <div class="wave-title">🌊 第 ${waveNum} 波</div>
                    <div class="wave-info">
                        <span>⏱️ 3秒后开始</span>
                    </div>
                </div>
            `;
            document.body.appendChild(announcement);

            setTimeout(() => {
                announcement.style.opacity = '0';
                setTimeout(() => {
                    announcement.remove();
                }, 500);
            }, 2500);
        }

        // Update game
        function update() {
            if (gameState !== 'playing') return;
            
            gameTime++;
            
            // Spawn enemies
            if (waveInProgress && enemiesToSpawn.length > 0) {
                spawnTimer++;
                if (spawnTimer >= 40) { // Spawn every 40 frames
                    const type = enemiesToSpawn.shift();
                    enemies.push(createEnemy(type));
                    spawnTimer = 0;
                }
            }
            
            // Check wave end
            if (waveInProgress && enemiesToSpawn.length === 0 && enemies.length === 0) {
                waveInProgress = false;

                // Bonus gold for completing wave
                gold += 50 + wave * 10;

                // Auto start next wave after 3 seconds
                setTimeout(() => {
                    if (gameState === 'playing') {
                        wave++;
                        updateUI();
                        startWave();
                    }
                }, 3000);

                // Show wave announcement
                showWaveAnnouncement(wave + 1);
                updateUI();
            }
            
            // Update towers
            towers.forEach(tower => {
                const tType = towerTypes[tower.type];
                
                // Gold generation
                if (tower.type === 'gold') {
                    tower.goldTimer++;
                    if (tower.goldTimer >= tType.goldInterval) {
                        gold += tType.goldGeneration * tower.level;
                        tower.goldTimer = 0;
                        createFloatingText(tower.x, tower.y - 20, `+${tType.goldGeneration * tower.level}`, '#ffd700');
                        updateUI();
                    }
                    return;
                }
                
                // Find target
                tower.fireCooldown--;
                
                if (tower.fireCooldown <= 0) {
                    let target = null;
                    let minDistance = Infinity;
                    
                    // Find enemy in range
                    for (const enemy of enemies) {
                        const dx = enemy.x - tower.x;
                        const dy = enemy.y - tower.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const range = tType.range * CELL_SIZE;
                        
                        if (distance <= range && distance < minDistance) {
                            minDistance = distance;
                            target = enemy;
                        }
                    }
                    
                    if (target) {
                        projectiles.push(createProjectile(tower, target, target.x, target.y));
                        tower.fireCooldown = 60 / tType.fireRate;
                        
                        // Recoil animation
                        tower.recoil = 5;
                    }
                }
                
                if (tower.recoil > 0) tower.recoil *= 0.9;
            });
            
            // Update enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                
                // Apply slow effect
                let currentSpeed = enemy.speed;
                if (enemy.slowTimer > 0) {
                    currentSpeed *= 0.5;
                    enemy.slowTimer--;
                }
                
                // Move along path
                const targetGrid = path[enemy.pathIndex + 1];
                if (targetGrid) {
                    const targetPos = gridToPixel(targetGrid.x, targetGrid.y);
                    const dx = targetPos.x - enemy.x;
                    const dy = targetPos.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < currentSpeed) {
                        enemy.x = targetPos.x;
                        enemy.y = targetPos.y;
                        enemy.pathIndex++;
                        enemy.gridX = targetGrid.x;
                        enemy.gridY = targetGrid.y;
                        
                        if (enemy.pathIndex >= path.length - 1) {
                            // Enemy reached end
                            lives--;
                            createParticles(enemy.x, enemy.y, '#e74c3c', 8);
                            enemies.splice(i, 1);
                            updateUI();
                            
                            if (lives <= 0) {
                                gameOver();
                            }
                            continue;
                        }
                    } else {
                        enemy.x += (dx / distance) * currentSpeed;
                        enemy.y += (dy / distance) * currentSpeed;
                    }
                }
                
                // Apply effects
                enemy.effects = enemy.effects.filter(effect => {
                    effect.duration--;
                    return effect.duration > 0;
                });
            }
            
            // Update projectiles
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const proj = projectiles[i];
                
                proj.x += proj.vx;
                proj.y += proj.vy;
                
                // Check bounds
                if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
                    projectiles.splice(i, 1);
                    continue;
                }
                
                // Check collision with enemies
                let hit = false;
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    const dx = enemy.x - proj.x;
                    const dy = enemy.y - proj.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Check if already pierced this enemy
                    if (proj.pierce && proj.pierced.includes(enemy)) continue;
                    
                    if (distance < enemy.radius + 5) {
                        // Hit enemy
                        hit = true;
                        
                        if (proj.slowFactor > 0) {
                            enemy.slowTimer = proj.slowDuration;
                        }
                        
                        // Splash damage
                        if (proj.splashRadius > 0) {
                            createParticles(proj.x, proj.y, proj.color, 10);
                            for (const otherEnemy of enemies) {
                                const odx = otherEnemy.x - proj.x;
                                const ody = otherEnemy.y - proj.y;
                                const odist = Math.sqrt(odx * odx + ody * ody);
                                if (odist < proj.splashRadius * CELL_SIZE) {
                                    otherEnemy.health -= proj.damage * (1 - odist / (proj.splashRadius * CELL_SIZE));
                                    updateUI();
                                }
                            }
                        } else {
                            enemy.health -= proj.damage;
                            if (!proj.pierce) createParticles(proj.x, proj.y, proj.color, 3);
                            updateUI();
                        }
                        
                        if (proj.pierce) {
                            proj.pierced.push(enemy);
                            hit = false; // Continue flying
                        }
                        
                        // Check enemy death
                        if (enemy.health <= 0) {
                            gold += enemy.reward;
                            enemiesKilled++;
                            createParticles(enemy.x, enemy.y, enemy.color, 8);
                            createFloatingText(enemy.x, enemy.y, `+${enemy.reward}💰`, '#ffd700');
                            enemies.splice(j, 1);
                            updateUI();
                        }
                        
                        if (!proj.pierce) break;
                    }
                }
                
                if (hit && !proj.pierce) {
                    projectiles.splice(i, 1);
                } else if (proj.pierce && proj.pierced.length > 3) {
                    projectiles.splice(i, 1);
                }
            }
            
            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                
                if (p.life <= 0) {
                    particles.splice(i, 1);
                }
            }
        }
        
        // Draw functions
        function draw() {
            // Clear canvas
            ctx.fillStyle = '#0d2137';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw grid
            ctx.strokeStyle = 'rgba(212, 168, 75, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= GRID_SIZE; i++) {
                ctx.beginPath();
                ctx.moveTo(i * CELL_SIZE, 0);
                ctx.lineTo(i * CELL_SIZE, canvas.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i * CELL_SIZE);
                ctx.lineTo(canvas.width, i * CELL_SIZE);
                ctx.stroke();
            }
            
            // Draw path
            ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
            for (let i = 0; i < path.length - 1; i++) {
                const p1 = path[i];
                const p2 = path[i + 1];
                
                if (p1.x === p2.x) {
                    const y1 = Math.min(p1.y, p2.y) * CELL_SIZE;
                    const y2 = (Math.max(p1.y, p2.y) + 1) * CELL_SIZE;
                    ctx.fillRect(p1.x * CELL_SIZE, y1, CELL_SIZE, y2 - y1);
                } else {
                    const x1 = Math.min(p1.x, p2.x) * CELL_SIZE;
                    const x2 = (Math.max(p1.x, p2.x) + 1) * CELL_SIZE;
                    ctx.fillRect(x1, p1.y * CELL_SIZE, x2 - x1, CELL_SIZE);
                }
            }
            
            // Draw path borders
            ctx.strokeStyle = 'rgba(212, 168, 75, 0.3)';
            ctx.lineWidth = 2;
            for (let i = 0; i < path.length - 1; i++) {
                const p1 = path[i];
                const p2 = path[i + 1];
                
                ctx.beginPath();
                if (p1.x === p2.x) {
                    const x = p1.x * CELL_SIZE + CELL_SIZE / 2;
                    const y1 = Math.min(p1.y, p2.y) * CELL_SIZE;
                    const y2 = (Math.max(p1.y, p2.y) + 1) * CELL_SIZE;
                    ctx.moveTo(x, y1);
                    ctx.lineTo(x, y2);
                } else {
                    const y = p1.y * CELL_SIZE + CELL_SIZE / 2;
                    const x1 = Math.min(p1.x, p2.x) * CELL_SIZE;
                    const x2 = (Math.max(p1.x, p2.x) + 1) * CELL_SIZE;
                    ctx.moveTo(x1, y);
                    ctx.lineTo(x2, y);
                }
                ctx.stroke();
            }
            
            // Draw start and end markers
            const startPos = gridToPixel(path[0].x, path[0].y);
            const endPos = gridToPixel(path[path.length - 1].x, path[path.length - 1].y);
            
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(startPos.x, startPos.y, CELL_SIZE * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `${CELL_SIZE * 0.3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏴‍☠️', startPos.x, startPos.y);
            
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(endPos.x, endPos.y, CELL_SIZE * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText('💎', endPos.x, endPos.y);
            
            // Draw range indicator
            if (showRange && rangePosition) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                let range = selectedTowerType ? towerTypes[selectedTowerType].range * CELL_SIZE : 0;
                if (selectedTower) {
                    range = towerTypes[selectedTower.type].range * CELL_SIZE;
                }
                ctx.arc(rangePosition.x, rangePosition.y, range, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            
            // Draw valid placement indicator
            if (selectedTowerType && rangePosition) {
                const grid = pixelToGrid(rangePosition.x, rangePosition.y);
                const valid = canPlaceTower(grid.x, grid.y);
                const pixel = gridToPixel(grid.x, grid.y);
                
                ctx.fillStyle = valid ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)';
                ctx.fillRect(grid.x * CELL_SIZE, grid.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
            
            // Draw towers
            towers.forEach(tower => {
                const tType = towerTypes[tower.type];
                
                // Base
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(tower.x, tower.y + 5, CELL_SIZE * 0.35, 0, Math.PI * 2);
                ctx.fill();
                
                // Tower body
                const recoil = tower.recoil || 0;
                const gradient = ctx.createRadialGradient(
                    tower.x - 5, tower.y - 5, 0,
                    tower.x, tower.y, CELL_SIZE * 0.35
                );
                gradient.addColorStop(0, tType.color);
                gradient.addColorStop(1, darkenColor(tType.color, 30));
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(tower.x, tower.y - recoil, CELL_SIZE * 0.35, 0, Math.PI * 2);
                ctx.fill();
                
                // Border
                ctx.strokeStyle = '#d4a84b';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(tower.x, tower.y - recoil, CELL_SIZE * 0.35, 0, Math.PI * 2);
                ctx.stroke();
                
                // Level indicator
                if (tower.level > 1) {
                    ctx.fillStyle = '#ffd700';
                    ctx.font = `bold ${CELL_SIZE * 0.2}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(tower.level, tower.x, tower.y - recoil);
                }
                
                // Selection highlight
                if (selectedTower === tower) {
                    ctx.strokeStyle = '#ffd700';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(tower.x, tower.y, CELL_SIZE * 0.45, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            });
            
            // Draw enemies
            enemies.forEach(enemy => {
                const eType = enemyTypes[enemy.type];
                
                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(enemy.x, enemy.y + enemy.radius * 0.5, enemy.radius, enemy.radius * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Body
                ctx.fillStyle = enemy.color;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Border
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Flying indicator
                if (enemy.flying) {
                    ctx.fillStyle = '#87ceeb';
                    ctx.font = `${enemy.radius}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('✈️', enemy.x, enemy.y);
                }
                
                // Boss indicator
                if (enemy.boss) {
                    ctx.fillStyle = '#ffd700';
                    ctx.font = `bold ${enemy.radius * 0.8}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('👑', enemy.x, enemy.y);
                }
                
                // Health bar
                const barWidth = enemy.radius * 2;
                const barHeight = 4;
                const healthPercent = enemy.health / enemy.maxHealth;
                
                ctx.fillStyle = '#333';
                ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 8, barWidth, barHeight);
                
                ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
                ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 8, barWidth * healthPercent, barHeight);
                
                // Slow effect
                if (enemy.slowTimer > 0) {
                    ctx.strokeStyle = '#00ced1';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(enemy.x, enemy.y, enemy.radius + 3, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
            
            // Draw projectiles
            projectiles.forEach(proj => {
                ctx.fillStyle = proj.color;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Glow effect
                ctx.shadowColor = proj.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });
            
            // Draw particles
            particles.forEach(p => {
                const alpha = p.life / p.maxLife;
                
                if (p.isText) {
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = alpha;
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(p.text, p.x, p.y);
                    ctx.globalAlpha = 1;
                } else {
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            });
        }
        
        // Helper function to darken color
        function darkenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) - amt;
            const G = (num >> 8 & 0x00FF) - amt;
            const B = (num & 0x0000FF) - amt;
            return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255))
                .toString(16).slice(1);
        }
        
        // Game loop
        function gameLoop() {
            update();
            draw();
            animationId = requestAnimationFrame(gameLoop);
        }
        
        // Start game
        function startGame() {
            const diff = difficultySettings[difficulty];
            
            gameState = 'playing';
            gold = diff.initialGold;
            lives = 20;
            wave = 1;
            enemiesKilled = 0;
            
            towers = [];
            enemies = [];
            projectiles = [];
            particles = [];
            waveInProgress = false;
            enemiesToSpawn = [];
            selectedTowerType = null;
            selectedTower = null;
            
            document.getElementById('mainMenu').classList.add('hidden');
            document.getElementById('gameOverMenu').classList.add('hidden');
            document.getElementById('gameUI').style.display = 'flex';
            document.getElementById('gameControls').style.display = 'block';
            document.getElementById('towerPanel').style.display = 'flex';
            document.getElementById('pauseIndicator').style.display = 'none';
            document.getElementById('nextWaveBtn').classList.add('show');
            
            resizeCanvas();
            initPath();
            updateUI();
            // Start first wave immediately
            startWave();
            
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            gameLoop();
        }
        
        // Game over
        function gameOver() {
            gameState = 'gameover';
            document.getElementById('gameOverTitle').textContent = '游戏结束';
            document.getElementById('gameOverTitle').classList.remove('victory-title');
            document.getElementById('finalWave').textContent = wave;
            document.getElementById('finalGold').textContent = gold;
            document.getElementById('finalKills').textContent = enemiesKilled;
            document.getElementById('gameOverMenu').classList.remove('hidden');
            document.getElementById('gameControls').style.display = 'none';
            document.getElementById('towerPanel').style.display = 'none';
        }
        
        // Update UI
        function updateUI() {
            document.getElementById('goldDisplay').textContent = gold;
            document.getElementById('waveDisplay').textContent = wave;
            document.getElementById('enemyDisplay').textContent = enemies.length;
            
            const heartsContainer = document.getElementById('livesDisplay');
            heartsContainer.innerHTML = '';
            const maxHearts = 10;
            const fullHearts = Math.min(lives, maxHearts);
            for (let i = 0; i < maxHearts; i++) {
                const heart = document.createElement('span');
                heart.className = 'heart' + (i >= lives ? ' lost' : '');
                heart.textContent = '❤';
                heartsContainer.appendChild(heart);
            }
            
            // Update tower buttons
            document.querySelectorAll('.tower-btn').forEach(btn => {
                const towerType = btn.dataset.tower;
                const cost = towerTypes[towerType].cost;
                if (gold < cost) {
                    btn.classList.add('disabled');
                } else {
                    btn.classList.remove('disabled');
                }
                
                if (selectedTowerType === towerType) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        }
        
        // Canvas mouse events
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            rangePosition = {x, y};
            showRange = selectedTowerType !== null || selectedTower !== null;
        });
        
        canvas.addEventListener('mouseleave', () => {
            showRange = false;
            rangePosition = null;
        });
        
        canvas.addEventListener('click', (e) => {
            if (gameState !== 'playing') return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const grid = pixelToGrid(x, y);
            
            // Check if clicked on existing tower
            const clickedTower = getTowerAt(grid.x, grid.y);
            if (clickedTower) {
                selectedTower = clickedTower;
                selectedTowerType = null;
                showTowerInfo(clickedTower);
                updateUI();
                return;
            }
            
            // Hide tower info if clicking elsewhere
            hideTowerInfo();
            selectedTower = null;
            
            // Place new tower
            if (selectedTowerType && canPlaceTower(grid.x, grid.y)) {
                const tType = towerTypes[selectedTowerType];
                if (gold >= tType.cost) {
                    gold -= tType.cost;
                    const pos = gridToPixel(grid.x, grid.y);
                    
                    const newTower = {
                        type: selectedTowerType,
                        x: pos.x,
                        y: pos.y,
                        gridX: grid.x,
                        gridY: grid.y,
                        level: 1,
                        fireCooldown: 0,
                        recoil: 0,
                        goldTimer: 0
                    };
                    
                    towers.push(newTower);
                    createParticles(pos.x, pos.y, tType.color, 5);
                    updateUI();
                    
                    // Deselect after placing
                    selectedTowerType = null;
                    showRange = false;
                }
            }
        });
        
        // Show tower info popup
        function showTowerInfo(tower) {
            const popup = document.getElementById('towerInfoPopup');
            const tType = towerTypes[tower.type];
            
            document.getElementById('popupTitle').textContent = `${tType.icon} ${tType.name}`;
            document.getElementById('popupDamage').textContent = Math.floor(tType.damage * tower.level);
            document.getElementById('popupRange').textContent = tType.range + '格';
            document.getElementById('popupSpeed').textContent = tType.fireRate > 5 ? '快' : tType.fireRate > 2 ? '中' : '慢';
            document.getElementById('popupLevel').textContent = tower.level;
            
            const upgradeCost = Math.floor(tType.cost * 0.7 * tower.level);
            document.getElementById('upgradeCost').textContent = upgradeCost;
            
            const sellPrice = Math.floor(tType.cost * 0.5 * tower.level * 0.8);
            document.getElementById('sellPrice').textContent = sellPrice;
            
            const upgradeBtn = document.getElementById('upgradeBtn');
            if (gold >= upgradeCost) {
                upgradeBtn.classList.remove('disabled');
            } else {
                upgradeBtn.classList.add('disabled');
            }
            
            // Position popup near tower
            const rect = canvas.getBoundingClientRect();
            const pixel = gridToPixel(tower.gridX, tower.gridY);
            popup.style.left = (rect.left + pixel.x + CELL_SIZE) + 'px';
            popup.style.top = (rect.top + pixel.y - 50) + 'px';
            popup.classList.add('show');
            
            // Store current tower for buttons
            popup.dataset.towerX = tower.gridX;
            popup.dataset.towerY = tower.gridY;
        }
        
        // Hide tower info popup
        function hideTowerInfo() {
            document.getElementById('towerInfoPopup').classList.remove('show');
        }
        
        // Tower button events
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                
                const towerType = btn.dataset.tower;
                if (selectedTowerType === towerType) {
                    selectedTowerType = null;
                } else {
                    selectedTowerType = towerType;
                    selectedTower = null;
                    hideTowerInfo();
                }
                updateUI();
            });
        });
        
        // Upgrade button
        document.getElementById('upgradeBtn').addEventListener('click', () => {
            const popup = document.getElementById('towerInfoPopup');
            const x = parseInt(popup.dataset.towerX);
            const y = parseInt(popup.dataset.towerY);
            const tower = getTowerAt(x, y);
            
            if (tower) {
                const tType = towerTypes[tower.type];
                const upgradeCost = Math.floor(tType.cost * 0.7 * tower.level);
                
                if (gold >= upgradeCost) {
                    gold -= upgradeCost;
                    tower.level++;
                    createParticles(tower.x, tower.y, '#ffd700', 8);
                    createFloatingText(tower.x, tower.y - 20, '⬆️ 升级!', '#ffd700');
                    updateUI();
                    showTowerInfo(tower);
                }
            }
        });
        
        // Sell button
        document.getElementById('sellBtn').addEventListener('click', () => {
            const popup = document.getElementById('towerInfoPopup');
            const x = parseInt(popup.dataset.towerX);
            const y = parseInt(popup.dataset.towerY);
            const towerIndex = towers.findIndex(t => t.gridX === x && t.gridY === y);
            
            if (towerIndex >= 0) {
                const tower = towers[towerIndex];
                const tType = towerTypes[tower.type];
                const sellPrice = Math.floor(tType.cost * 0.5 * tower.level * 0.8);
                
                gold += sellPrice;
                createParticles(tower.x, tower.y, '#e74c3c', 6);
                createFloatingText(tower.x, tower.y - 20, `+${sellPrice}💰`, '#ffd700');
                
                towers.splice(towerIndex, 1);
                hideTowerInfo();
                selectedTower = null;
                updateUI();
            }
        });
        
        // Close popup button
        document.getElementById('closePopupBtn').addEventListener('click', hideTowerInfo);
        
        // Next wave button
        document.getElementById('nextWaveBtn').addEventListener('click', startWave);
        
        // Menu button events
        document.getElementById('startBtn').addEventListener('click', startGame);
        document.getElementById('restartBtn').addEventListener('click', startGame);
        document.getElementById('menuBtn').addEventListener('click', () => {
            document.getElementById('gameOverMenu').classList.add('hidden');
            document.getElementById('mainMenu').classList.remove('hidden');
            document.getElementById('gameUI').style.display = 'none';
            document.getElementById('gameControls').style.display = 'none';
            document.getElementById('towerPanel').style.display = 'none';
            gameState = 'menu';
        });
        
        document.getElementById('homeBtn').addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
        
        // Difficulty buttons
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                difficulty = btn.dataset.diff;
            });
        });
        
        // Pause menu functions
        function showPauseMenu() {
            if (gameState === 'playing') {
                gameState = 'paused';
                document.getElementById('pauseMenu').classList.add('show');
                document.getElementById('pauseIndicator').style.display = 'none';
            }
        }
        
        function hidePauseMenu() {
            document.getElementById('pauseMenu').classList.remove('show');
        }
        
        function resumeGame() {
            hidePauseMenu();
            gameState = 'playing';
        }
        
        function backToMenu() {
            hidePauseMenu();
            hideTowerInfo();
            document.getElementById('gameControls').style.display = 'none';
            document.getElementById('gameUI').style.display = 'none';
            document.getElementById('towerPanel').style.display = 'none';
            document.getElementById('mainMenu').classList.remove('hidden');
            gameState = 'menu';
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        }
        
        function goBackHome() {
            if (gameState === 'playing') {
                const confirmMsg = '确定要退出游戏吗？当前进度将丢失。';
                if (confirm(confirmMsg)) {
                    window.location.href = '../../index.html';
                }
            } else {
                window.location.href = '../../index.html';
            }
        }
        
        // Additional event listeners
        document.getElementById('gamePauseBtn').addEventListener('click', showPauseMenu);
        document.getElementById('backHomeBtn').addEventListener('click', goBackHome);
        document.getElementById('resumeBtn').addEventListener('click', resumeGame);
        document.getElementById('pauseBackMenuBtn').addEventListener('click', backToMenu);
        document.getElementById('pauseHomeBtn').addEventListener('click', goBackHome);
        document.getElementById('gameOverHomeBtn').addEventListener('click', goBackHome);
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Spacebar') {
                if (gameState === 'playing' || gameState === 'paused') {
                    showPauseMenu();
                }
            } else if (e.key === 'Escape') {
                if (gameState === 'playing') {
                    showPauseMenu();
                } else if (gameState === 'paused') {
                    resumeGame();
                }
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            if (gameState === 'playing' || gameState === 'paused') {
                resizeCanvas();
            }
        });
        
        // Initialize - wait for DOM to load
        document.addEventListener('DOMContentLoaded', () => {
            resizeCanvas();
            initPath();
            draw();
        });
    
