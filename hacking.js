class Sound {
    constructor(src) {
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
    }

    play() {

        this.sound.currentTime = 0; //reset sound
        this.sound.play();
    }

    stop() {
        this.sound.pause();
    }
}

let gameInterval;
gameOver = false;
const pageX = 0;
const pageY = 0;
currentFrame = 0;

const player = new component(600, 400, 90, 40, "./hackingSprites/cursor.png", 0, 0, type = "player");

const playerMaxSpeed = 10;
const playerAcceleration = 2.5;
const playerDeceleration = 3;
playerHealth = 5;
curPlayerIFrames = 0;
const playerIFrames = 30;
const playerFireCooldownFrames = 2;
const enemyFireCooldownFrames = 5;
currentEnemyCooldownFrames = 0;
const bulletSpeed = 12;
const enemyBulletSpeed = 10;
const enemySize = 60;

currentCooldownFrames = 0;

const obstacles = [];
const playerBullets = [];
enemyBullets = [];
const enemies = [];

const levelTransitionTimer = 60;
levelTransitionFrame = 0;
currentLevel = 0;

const playerShotSfx = new Sound("./audio/playerShot.ogg");
const playerHitSfx = new Sound("./audio/playerHit.ogg");
const buttonClickSfx = new Sound("./audio/buttonClick.ogg");
const coreExplodeSfx = new Sound("./audio/coreExplode.ogg");
const playerExplodeSfx = new Sound("./audio/playerExplode.ogg");

const gameArea = {
    canvas: document.createElement("canvas"),
    setup: function () {
        this.canvas.width = 800;
        this.canvas.height = 800;
        this.canvas.style.backgroundColor = "#c2bda6";
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.getElementById("clockCanvas"));
        document.body.insertBefore(document.createElement("br"), document.getElementById("clockCanvas"));

        this.frameCount = 0;
        this.mouseDown = false;
        this.score = 0;
        this.scoreText = new component(10, 30, "25px", "Consolas", "white", 0, 0, type = "text");
        this.scoreText.text = "Score: " + this.score;

        //for key presses
        window.addEventListener('keydown', function (e) {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) {
                e.preventDefault();
            }

            gameArea.keys = (gameArea.keys || {});
            gameArea.keys[e.code] = true;

            if(gameArea.keys.Space == true)
                startGame();
        });
        window.addEventListener('keyup', function (e) {
            if (gameArea.keys)
                gameArea.keys[e.code] = false;
        });

        //for mouse clicks
        window.addEventListener('mousedown', function (e) {
            gameArea.mouseDown = true;
        });

        window.addEventListener('mouseup', function (e) {
            gameArea.mouseDown = false;
        });

        window.addEventListener('mousemove', function (e) {
            gameArea.mouseX = e.pageX - gameArea.canvas.offsetLeft;
            gameArea.mouseY = e.pageY - gameArea.canvas.offsetTop;
        });

        //touch event/tap event
        window.addEventListener('touchmove', function (e) {
            gameArea.touchX = e.touches[0].screenX;
            gameArea.touchY = e.touches[0].screenY;
        });
    },

    update: function () {
        console.log(playerBullets.length);
        this.frameCount += 1;
        //clears the background
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        //move player based on events

        r = gameArea.keys["KeyD"] === true ? 1 : 0;
        u = gameArea.keys["KeyW"] === true ? 1 : 0;
        l = gameArea.keys["KeyA"] === true ? 1 : 0;
        d = gameArea.keys["KeyS"] === true ? 1 : 0;

        moveDir = [(r-l), (d-u)];
        magnitude = Math.sqrt(moveDir[0]*moveDir[0] + moveDir[1]*moveDir[1]);
        moveDirNormalized = [moveDir[0]/magnitude, moveDir[1]/magnitude];

        if (gameArea.keys) {

            if(magnitude != 0){
                player.vx += playerAcceleration * ((r-l)/magnitude);
                player.vy += playerAcceleration * ((d-u)/magnitude);
            }

             if((r - l) == 0){
                if(player.vx > 0){
                    if(player.vx - playerDeceleration >= 0)
                        player.vx -= playerDeceleration;
                    else
                        player.vx = 0;
                }
                if(player.vx < 0)
                    player.vx += playerDeceleration;
            }

            if((u - d) == 0){
                if(player.vy > 0)
                    if(player.vy - playerDeceleration >= 0)
                        player.vy -= playerDeceleration;
                    else
                        player.vy = 0;
                if(player.vy < 0)
                    player.vy += playerDeceleration;
            }

            if(player.vx > playerMaxSpeed){
                player.vx = playerMaxSpeed;
            }
            if(player.vx < -playerMaxSpeed){
                player.vx = -playerMaxSpeed;
            }
            if(player.vy > playerMaxSpeed){
                player.vy = playerMaxSpeed;
            }
            if(player.vy < -playerMaxSpeed){
                player.vy = -playerMaxSpeed;
            }

            if (gameArea.mouseDown) {
                if(currentCooldownFrames == playerFireCooldownFrames){
                    playerShotSfx.play();
                    this.playerShoot();
                    currentCooldownFrames = 0;
                }
                else
                    currentCooldownFrames++;
            }

            if (gameArea.mouseX && gameArea.mouseY) {
                //player faces mouse cursor
                direction = [gameArea.mouseX - player.x, gameArea.mouseY - player.y];
                player.angle = Math.atan(direction[1] / direction[0]);
                if(Math.sign(gameArea.mouseX - player.x) == -1){
                    player.image.src = "./hackingSprites/cursorflp.png";
                }
                else{
                    player.image.src = "./hackingSprites/cursor.png";
                }
    
            }
    
            for(e in obstacles)
            {
                player.collideWith(e)
            }
            
        }
    },

    playerShoot: function() {
        direction = [gameArea.mouseX - player.x, gameArea.mouseY - player.y];
        magnitude = Math.sqrt(direction[0]*direction[0] + direction[1]*direction[1]);
        normalizedDx = direction[0]/magnitude;
        normalizedDy = direction[1]/magnitude;

        bullet = new component(player.x, player.y, 60, 15, "white");
        bullet.angle = player.angle;
        bullet.vx = normalizedDx * bulletSpeed;
        bullet.vy = normalizedDy * bulletSpeed;
        
        playerBullets.push(bullet);


    },

    playerHit: function() {
        if(curPlayerIFrames <= 0){
            playerHealth--;
            playerHitSfx.play();
            curPlayerIFrames = playerIFrames;
        }
    },

    reset: function () {  
        clearInterval(gameInterval);
        currentFrame = 0;
        gameOver = false;

        enemies.length = 0;
        enemyBullets.length = 0;
        currentEnemyCooldownFrames = 0;

        enemy = new component(0, 100, enemySize, enemySize, "./hackingSprites/enemy.png", 0, 0, type = "image");
        enemy.health = 20;
        enemy.enemyPathing = "cosX";
        enemy.enemyType = "trishot";
        enemy.startX = 400;
        enemy.startY = 100;

        enemy2 = new component(100, 500, enemySize, enemySize, "./hackingSprites/enemy.png", 0, 0, type = "image");
        enemy2.health = 20;
        enemy2.enemyPathing = "circle";
        enemy2.enemyType = "diagonals";
        enemy2.startX = 400;
        enemy2.startY = 400;

        enemy3 = new component(400, 400, enemySize, enemySize, "./hackingSprites/enemy.png", 0, 0, type = "image");
        enemy3.health = 20;
        //enemy3.enemyPathing = "cosX";
        enemy3.enemyType = "rotcurved";
        enemy3.startX = 400;
        enemy3.startY = 400;



        switch(currentLevel)
        {
            case 0:
                enemies.push(enemy3);
                break;
            case 1:
                enemies.push(enemy2);
                break;
            case 2:
                enemies.push(enemy);
                enemies.push(enemy2);
                break;
            case 3:
                enemies.push(enemy);
                gameArea.scoreText.text = "You Did It!";
                break;
        }

        playerBullets.length = 0;
        this.frameCount = 0;
        this.score = 0;
        this.scoreText.text = "";
        player.x = 400;
        player.y = 600;
        playerHealth = 5;
        playerShotSfx.sound.volume = 0.25;
        playerHitSfx.sound.volume = 0.25;

        buttonClickSfx.play();
    }
}

function component(x, y, width, height, color, vx = 0, ay = 0, type = "rect", angle = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.vx = vx;
    this.vy = 0;
    this.ay = ay;
    this.type = type;
    this.angle = angle;
    this.text = "";
    this.enemyPathing = "";
    this.enemyType = "";
    this.startX;
    this.startY;

    this.health = 0;
    if (this.type === "image" || this.type === "player") {
        this.image = new Image();
        this.image.src = color; //color will represent the path to the image file
    }

    this.update = function() {
        //movement
        this.vy += this.ay;
        this.x += this.vx;
        this.y += this.vy;

        //redraws itself
        let ctx = gameArea.context;
        if (type === "rect") {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = color;
            ctx.fillRect(this.width / -2, this.height / -2, this.width, this.height);
            ctx.restore();
        } else if (type === "player") {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.drawImage(this.image, this.width / -2, this.height / -2, this.width, this.height);
            ctx.restore();
        } else if (this.type === "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = color;
            ctx.fillText(this.text, this.x, this.y);
        } else if (this.type === "image") {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.drawImage(this.image, this.width / -2, this.height / -2, this.width, this.height);
            ctx.restore();
        }
    }

    // Helper function to rotate a point (x, y) around a given point (cx, cy) by the given angle in radians
    function rotatePoint(x, y, cx, cy, angle) {
        x -= cx;
        y -= cy;
        const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
        const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
        return [rotatedX + cx, rotatedY + cy];
    }

    // Helper function to project a rotated rectangle onto an axis
    function projectRotatedRect(rect, axis) {
        const points = [
            [-rect.width / 2, -rect.height / 2],
            [rect.width / 2, -rect.height / 2],
            [rect.width / 2, rect.height / 2],
            [-rect.width / 2, rect.height / 2]
        ];

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        for (const [x, y] of points) {
            const [rotatedX, rotatedY] = rotatePoint(x + rect.x, y + rect.y, rect.x, rect.y, rect.angle);
            const projected = rotatedX * axis[0] + rotatedY * axis[1];
            min = Math.min(min, projected);
            max = Math.max(max, projected);
        }

        return { min, max };
    }

    // Helper function to check if two rotated rectangles intersect using the Separating Axis Theorem
    function intersectRotatedRects(rect1, rect2) {
        const axes = [
            [1, 0], // X-axis
            [0, 1], // Y-axis
            [Math.cos(rect1.angle), Math.sin(rect1.angle)], // Rectangle 1's angle
            [-Math.sin(rect2.angle), Math.cos(rect2.angle)] // Rectangle 2's angle
        ];

        for (const axis of axes) {
            const proj1 = projectRotatedRect(rect1, axis);
            const proj2 = projectRotatedRect(rect2, axis);

            if (proj1.max < proj2.min || proj2.max < proj1.min) {
                return false; // No overlap along this axis, so the rectangles don't intersect
            }
        }

        return true; // All axes overlap, so the rectangles intersect
    }

    this.collideWith = function(otherObj) {
        return intersectRotatedRects(this, otherObj) ? 1 : 0;
    }
}


function startGame() {
    gameArea.reset();
    gameInterval = setInterval(updateGame, 1000 / 60);
}

function stopGame() {
    clearInterval(gameInterval);
    //logic of game over message
}

function updateGame() {
    gameArea.update();
    if(gameOver != true){
    currentFrame++;

    if(curPlayerIFrames > 0)
        curPlayerIFrames--;
    
    if(currentEnemyCooldownFrames > enemyFireCooldownFrames)
        currentEnemyCooldownFrames = 0;
    else
        currentEnemyCooldownFrames++;

    if(playerHealth <= 0){
        playerExplodeSfx.play();
        stopGame();
    }

    if(enemyBullets.length > 0){
        for (let i = 0; i < enemyBullets.length; i++) {
            enemyBullets[i].update();
            if(enemyBullets[i].collideWith(player))
            {
                enemyBullets.splice(i, 1);
                gameArea.playerHit();
            }
            if(playerBullets.length > 0)
            {
                for (let j = 0; j < playerBullets.length; j++) {
                    if(playerBullets[j].collideWith(enemyBullets[i]) == 1){
                        enemyBullets.splice(i, 1);
                        playerBullets.splice(j, 1);
                    }
                }
            }
        }
    }

    for (let i = 0; i < enemyBullets.length; i++) {
        if(enemyBullets[i].x >= 800 || enemyBullets.x <= 0 || enemyBullets[i].y >= 800 || enemyBullets[i].y <= 0)
            enemyBullets.splice(i, 1);
    }

    if(playerBullets.length > 0){
        for (let i = 0; i < playerBullets.length; i++) {
            playerBullets[i].update();
            if(playerBullets[i].x >= 800 || playerBullets.x <= 0 || playerBullets[i].y >= 800 || playerBullets[i].y <= 0){
                playerBullets.splice(i, 1);
                break;
            }
            else{
                for (let j = 0; j < enemies.length; j++) {
                
                    if(enemies[j].collideWith(playerBullets[i]) == 1)
                    {
                        playerBullets.splice(i, 1);
                        enemies[j].health--;
                        break;

                        
                    };
                }
            }
        }
    }
    if(enemies.length > 0){

        for (let i = 0; i < enemies.length; i++) {

            switch (enemies[i].enemyPathing) {
                case "circle":
                    enemies[i].x = enemies[i].startX + 360*(Math.cos(currentFrame/60));
                    enemies[i].y = enemies[i].startY + 360*(Math.sin(currentFrame/60));
                    break;
                case "sinX":
                    enemies[i].x = enemies[i].startX + 360*(Math.sin(currentFrame/60));
                    break;
                case "cosX":
                    enemies[i].x = enemies[i].startX + 360*(Math.cos(currentFrame/60));
                    break;
              }

              if(currentEnemyCooldownFrames > enemyFireCooldownFrames){
                switch (enemies[i].enemyType) {
                    case "diagonals":
                        b1 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b1.vx = enemyBulletSpeed;
                        b1.vy = enemyBulletSpeed;
                
                        b2 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b2.vx = -enemyBulletSpeed;
                        b2.vy = -enemyBulletSpeed;
                
                        b3 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b3.vx = enemyBulletSpeed;
                        b3.vy = -enemyBulletSpeed;
                
                        b4 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b4.vx = -enemyBulletSpeed;
                        b4.vy = enemyBulletSpeed;

                        
                        enemyBullets.push(b1);
                        enemyBullets.push(b2);
                        enemyBullets.push(b3);
                        enemyBullets.push(b4);
                        break;

                    case "trishot":
                        b1 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b1.vx = Math.sin(0.61) * -enemyBulletSpeed;
                        b1.vy = Math.cos(0.61) * enemyBulletSpeed;
                
                        b2 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b2.vx = Math.sin(0.61) * enemyBulletSpeed;
                        b2.vy = Math.cos(0.61) * enemyBulletSpeed;
                
                        b3 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b3.vy = enemyBulletSpeed;

                        enemyBullets.push(b1);
                        enemyBullets.push(b2);
                        enemyBullets.push(b3);
                        break;

                    case "rotcurved":
                        b1 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b1.vx = Math.cos(currentFrame/60) * enemyBulletSpeed;
                        b1.vy = Math.sin(currentFrame/60) * enemyBulletSpeed;
                
                        b2 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b2.vx = Math.cos(currentFrame/60) * -enemyBulletSpeed;
                        b2.vy = Math.sin(currentFrame/60) * -enemyBulletSpeed;
                
                        b3 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b3.vx = Math.sin(currentFrame/60) * enemyBulletSpeed;
                        b3.vy = Math.cos(currentFrame/60) * -enemyBulletSpeed;
                
                        b4 = new component(enemies[i].x, enemies[i].y, 30, 30, "orange");
                        b4.vx = Math.sin(currentFrame/60) * -enemyBulletSpeed;
                        b4.vy = Math.cos(currentFrame/60) * enemyBulletSpeed;

                        
                        enemyBullets.push(b1);
                        enemyBullets.push(b2);
                        enemyBullets.push(b3);
                        enemyBullets.push(b4);
                        break;        
                }
            }
            if(enemies[i].collideWith(player) == 1){
                gameArea.playerHit();
            }
            if(enemies[i].health >= 0)
                enemies[i].update();
            else{
                enemies.splice(i, 1);
                coreExplodeSfx.play();
            }
        }
    }

    if(enemies.length == 0)
    {
        gameArea.scoreText.text = "HACKING COMPLETE";
        currentLevel++;
        gameOver = true;
    }
    player.update();
    }
    else
    {
        levelTransitionFrame++;

        if(levelTransitionFrame > levelTransitionTimer){
            gameArea.reset();
            gameArea.startGame();
        }
    }

    gameArea.scoreText.update();
}

function movePlayer(vx, vy) {
    playerPiece.vx = vx;
    playerPiece.vy = vy;
}

window.onload = gameArea.setup();


