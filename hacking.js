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

const playerIFrames = 120;
const playerFireCooldownFrames = 6;
const bulletSpeed = 10;

const enemyBulletSpeed = 6;

enemyBulletSwitchTimer = 0;
const enemyBulletSwitchInterval = 15;
enemyBulletColor = "#454138";
oldEnemyBulletColor = "#F34D08";


cameraOffsetX = 0;
cameraOffsetY = 0;

const playerMaxSpeed = 10;
const enemyMaxSpeed = 3;

const playerAcceleration = 1.5;
const playerDeceleration = 3;
playerHealth = 4;
curPlayerIFrames = 0;
currentEnemyCooldownFrames = 0;
const enemySize = 60;

currentCooldownFrames = 0;
const playerBullets = [];
enemyBullets = [];
const walls = [];
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
        document.body.insertBefore(this.canvas, document.getElementById("canvas"));
        document.body.insertBefore(document.createElement("br"), document.getElementById("canvas"));

        this.frameCount = 0;
        this.mouseDown = false;
        this.score = 0;
        this.scoreText = new component(300, 380, "25px", "Consolas", "white", 0, 0, type = "text");
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
                direction = [(gameArea.mouseX) - player.x, (gameArea.mouseY) - player.y];
                player.angle = Math.atan(direction[1] / direction[0]);
                if(Math.sign(gameArea.mouseX - player.x) == -1){
                    player.image.src = "./hackingSprites/cursorflp" + playerHealth + ".png";
                }
                else{
                    player.image.src = "./hackingSprites/cursor" + playerHealth + ".png";
                }
    
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

    createEnemy: function(health, pathing, eType, cooldown, startX, startY, enemySpeed = 20, enemySpread = 360) {
        sprite = "./hackingSprites/enemy.png";
        if(pathing == "pursue")
            sprite = "./hackingSprites/pursuer.png";
        enemy = new component(startX, startY, enemySize, enemySize, sprite, 0, 0, type = "enemy");
        enemy.health = health;
        enemy.enemyPathing = pathing;
        enemy.enemyType = eType;
        enemy.startX = startX;
        enemy.startY = startY;
        enemy.enemyFireCooldownFrames = cooldown;
        enemy.enemySpeed = enemySpeed;
        enemy.enemySpread = enemySpread;

        return enemy;
    },

    reset: function () {  
        clearInterval(gameInterval);
        currentFrame = 0;
        gameOver = false;

        cameraOffsetX = 0;
        cameraOffsetY = 0;

        enemies.length = 0;
        enemyBullets.length = 0;
        currentEnemyCooldownFrames = 0;

        levelTransitionFrame = 0;

        switch(currentLevel)
        {
            case 0:
                enemies.push(this.createEnemy(10, "cosX", "trishot", 60, 400, 100, 40, 360));
                // enemies.push(this.createEnemy(10, "pursue", "playershot", 60, 700, 350));
                // enemies.push(this.createEnemy(10, "pursue", "playershot", 60, 500, 500));
                break;
            case 1:
                enemies.push(this.createEnemy(15, "wavy", "trishot", 50, 400, 150, 40, 360));
                break;
            case 2:
                enemies.push(this.createEnemy(25, "pursue", "hexashot", 20 , 400, 50));
                break;
            case 3:
                enemies.push(this.createEnemy(25, "", "rotcurved", 3, 400, 400));
                break;
            case 4:
                enemies.push(this.createEnemy(25, "circle", "rotcurved", 40, 400, 400, 40, 360));
                break;
            case 5:
                enemies.push(this.createEnemy(10, "pursue", "playershot", 60, 600, 150));
                enemies.push(this.createEnemy(10, "pursue", "playershot", 60, 200, 150));
                break;

            case 6:
                enemies.push(this.createEnemy(10, "cosX", "trishot", 60, 400, 100, 40, 360));
                enemies.push(this.createEnemy(10, "pursue", "playershot", 60, 600, 350));
                enemies.push(this.createEnemy(10, "pursue", "playershot", 60, 200, 500));

                break;
            case 7:
                enemies.push(this.createEnemy(25, "", "rotcurved", 20, 250, 250, 40, 360));
                enemies.push(this.createEnemy(25, "", "rotcurvedopposite", 20, 550, 550, 40, 360));
                break;
            case 8:
                enemies.push(this.createEnemy(10, "pursue", "playershot", 60, 200, 200));
                enemies.push(this.createEnemy(10, "pursue", "playershot", 60, 600, 200));
                enemies.push(this.createEnemy(10, "pursue", "playershot", 60, 200, 600));
                enemies.push(this.createEnemy(10, "pursue", "playershot", 60, 600, 600));
                break;
            case 9:
                enemies.push(this.createEnemy(15, "", "", 60, 400, 150));
                enemies.push(this.createEnemy(15, "pursue", "", 60, 480, 180));
                enemies.push(this.createEnemy(15, "pursue", "", 60, 400, 200));
                enemies.push(this.createEnemy(15, "pursue", "", 60, 320, 180));
                enemies.push(this.createEnemy(15, "pursue", "", 60, 240, 160));
                enemies.push(this.createEnemy(15, "pursue", "", 60, 560, 160));
                enemies.push(this.createEnemy(15, "pursue", "", 60, 640, 140));
                enemies.push(this.createEnemy(15, "pursue", "", 60, 160, 140));
                break;
            case 10:
                enemies.push(this.createEnemy(15, "", "", 60, 1000, 1050));
                this.scoreText.text = "HACKING COMPLETE";
                break;

        }

        playerBullets.length = 0;
        this.frameCount = 0;
        this.score = 0;
        this.scoreText.text = "";
        player.x = 400;
        player.y = 600;
        playerHealth = 4; 
        enemyBulletSwitchTimer = 0;
        enemyBulletColor = "#454138";
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
    this.displayAngle = 0;
    this.text = "";
    this.enemyPathing = "";
    this.enemyType = "";
    this.enemyCooldown = 30;
    this.enemyFireCooldownFrames = 20;
    this.currentEnemyCooldownFrames = 0;
    this.enemySwitchRate = 0;
    this.enemySpread = 0;
    this.enemySpeed = 0;

    this.startX;
    this.startY;

    this.health = 0;
    if (this.type === "image" || this.type === "player" || this.type === "enemy") {
        this.image = new Image();
        this.image.src = color; //color will represent the path to the image file
    }

    this.move = function(vx, vy){
        canMoveX = true;
        canMoveY = true;
        if(this.type == "player"){
            tempPlayer = new component(player.x + vx, player.y + vy, 90, 40, "", 0, 0, type = "player");

            if(this.x + vx > 800 || this.x + vx < 0)
                 canMoveX = false;
            if(this.y + vy > 800 || this.y + vy < 0)
                 canMoveY = false;

            for (let i = 0; i < walls.length; i++) {
                if(tempPlayer.collideWith(walls[i])){
                    canMoveX = false;
                    canMoveY = false;
                }
            }

            
        }

        if(this.type === "enemy"){
            tempEnemy = new component(this.x + vx, this.y + vy, enemySize/3, enemySize/3, "", 0, 0, type = "enemy");
            tempPlayer = new component(player.x + vx, player.y + vy, 90, 40, "", 0, 0, type = "player");
            tempPlayer.angle = player.angle;
            for (let i = 0; i < enemies.length; i++) {
                if(enemies[i] != this){
                    if(tempEnemy.collideWith(enemies[i]) == 1){
                        canMoveX = false;
                        canMoveY = false;
                    }
                    if(tempEnemy.collideWith(tempPlayer) == 1){
                        canMoveX = false;
                        canMoveY = false;
                    }
                }
            }
        }

        if(canMoveX)
            this.x += vx;
        if(canMoveY)
            this.y += vy;
    }

    this.update = function() {
        //movement
        

        this.move(this.vx, this.vy);

        //redraws itself
        let ctx = gameArea.context;
        if (this.type === "rect") {
            ctx.save();
            //ctx.translate(this.x - (cameraOffsetX- 400), this.y - (cameraOffsetY- 400));
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = color;
            ctx.fillRect(this.width / -2, this.height / -2, this.width, this.height);
            ctx.restore();
        } else if (this.type === "player") {
            ctx.save();
            //ctx.translate(this.x - (cameraOffsetX- 400), this.y - (cameraOffsetY- 400));
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.drawImage(this.image, this.width / -2, this.height / -2, this.width, this.height);
            ctx.restore();
        } else if (this.type === "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = color;
            //ctx.fillText(this.text, this.x - (cameraOffsetX- 400), this.y - (cameraOffsetY- 400));
            ctx.fillText(this.text, this.x , this.y);
        } else if (this.type === "image" || this.type === "enemy") {
            ctx.save();
            //ctx.translate(this.x - (cameraOffsetX- 400), this.y - (cameraOffsetY- 400));
            ctx.translate(this.x, this.y);
            if(this.displayAngle != 0)
                ctx.rotate(this.displayAngle);
            else
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

    // Helper function to check if two rotated rectangles intersect using SAT
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

    playerToCamera = [player.x - cameraOffsetX, player.y - cameraOffsetY];
    if(playerToCamera[0] > 0){
        cameraOffsetX += playerToCamera[0]/5;
    } else if(playerToCamera[0] < 0){
        cameraOffsetX += playerToCamera[0]/5;
    }
    if(playerToCamera[1] > 0){
        cameraOffsetY += playerToCamera[1]/5;
    } else if(playerToCamera[1] < 0){
        cameraOffsetY += playerToCamera[1]/5;
    }
    

    

    if(enemyBulletSwitchTimer > enemyBulletSwitchInterval){
        if(enemyBulletColor == "#454138"){
            enemyBulletColor = "#F34D08"
            oldEnemyBulletColor = "#454138"
        }
        else{
            enemyBulletColor = "#454138";
            oldEnemyBulletColor = "#F34D08"
        }
        enemyBulletSwitchTimer = 0;
    } 

    if(playerHealth == 0){
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
            for (let j = 0; j < walls.length; j++) {
                if(enemyBullets[i].collideWith(walls[j]))
                    enemyBullets.splice(i, 1);
            }
        
        }
    }

    for (let i = 0; i < walls.length; i++) {
        walls[i].update();
    }

    for (let i = 0; i < playerBullets.length; i++) {
        for (let j = 0; j < enemyBullets.length; j++) {
            if(playerBullets[i].collideWith(enemyBullets[j]) == 1){
                if(enemyBullets[j].color == "#F34D08")
                    enemyBullets.splice(j, 1);
                
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
            //if(playerBullets[i].x >= (800 + cameraOffsetX) || playerBullets.x <= (0 + cameraOffsetX) || playerBullets[i].y >= (800 + cameraOffsetY) || playerBullets[i].y <= (0 - cameraOffsetY) ){
            if(playerBullets[i].x >= 800  || playerBullets.x <= 0  || playerBullets[i].y >= 800 || playerBullets[i].y <= 0  ){
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

            if(enemies[i].currentEnemyCooldownFrames > enemies[i].enemyFireCooldownFrames)
                enemies[i].currentEnemyCooldownFrames = 0;
            
                
            
            enemies[i].currentEnemyCooldownFrames++;

            switch (enemies[i].enemyPathing) {
                case "circle":
                    enemies[i].x = enemies[i].startX + enemies[i].enemySpread*(Math.cos(currentFrame/enemies[i].enemySpeed));
                    enemies[i].y = enemies[i].startY + enemies[i].enemySpread*(Math.sin(currentFrame/enemies[i].enemySpeed));
                    break;
                case "wavy":
                    enemies[i].x = enemies[i].startX + enemies[i].enemySpread*(Math.cos(currentFrame/enemies[i].enemySpeed));
                    enemies[i].y = enemies[i].startY + (Math.sin(currentFrame/enemies[i].enemySpeed) * Math.cos(currentFrame/enemies[i].enemySpeed) * 200);
                    break;
                case "sinX":
                    enemies[i].x = enemies[i].startX + enemies[i].enemySpread*(Math.sin(currentFrame/enemies[i].enemySpeed));
                    break;
                case "cosX":
                    enemies[i].x = enemies[i].startX + enemies[i].enemySpread*(Math.cos(currentFrame/enemies[i].enemySpeed));
                    break;
		        case "pursue":
                    direction = [player.x - enemies[i].x, player.y - enemies[i].y];
                    magnitude = Math.sqrt(direction[0]*direction[0] + direction[1]*direction[1]);
                    normalizedDx = direction[0]/magnitude;
                    normalizedDy = direction[1]/magnitude;
                    enemies[i].displayAngle = Math.atan(direction[1] / direction[0]);
                    if(enemies[i].x > player.x)
                        enemies[i].image.src = "./hackingSprites/pursuerflp.png";
                    else
                        enemies[i].image.src = "./hackingSprites/pursuer.png";
                    enemies[i].move(enemyMaxSpeed * normalizedDx, enemyMaxSpeed * normalizedDy);
                    break;
              }

              if(enemies[i].currentEnemyCooldownFrames > enemies[i].enemyFireCooldownFrames){
                enemyBulletSwitchTimer++;
                switch (enemies[i].enemyType) {
                    case "diagonals":
                        b1 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b1.vx = enemyBulletSpeed;
                        b1.vy = enemyBulletSpeed;
                
                        b2 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b2.vx = -enemyBulletSpeed;
                        b2.vy = -enemyBulletSpeed;
                
                        b3 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b3.vx = enemyBulletSpeed;
                        b3.vy = -enemyBulletSpeed;
                
                        b4 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b4.vx = -enemyBulletSpeed;
                        b4.vy = enemyBulletSpeed;

                        
                        enemyBullets.push(b1);
                        enemyBullets.push(b2);
                        enemyBullets.push(b3);
                        enemyBullets.push(b4);
                        break;

                    case "trishot":
                        b1 = new component(enemies[i].x, enemies[i].y, 30, 30, "#454138");
                        b1.vx = Math.sin(0.61) * -enemyBulletSpeed;
                        b1.vy = Math.cos(0.61) * enemyBulletSpeed;
                
                        b2 = new component(enemies[i].x, enemies[i].y, 30, 30, "#454138");
                        b2.vx = Math.sin(0.61) * enemyBulletSpeed;
                        b2.vy = Math.cos(0.61) * enemyBulletSpeed;
                
                        b3 = new component(enemies[i].x, enemies[i].y, 30, 30, "#454138");
                        b3.vy = enemyBulletSpeed;

                        enemyBullets.push(b1);
                        enemyBullets.push(b2);
                        enemyBullets.push(b3);
                        break;

                    case "rotcurved":
                        b1 = new component(enemies[i].x, enemies[i].y, 30, 30, "#454138");
                        b1.vx = Math.cos(currentFrame/60) * enemyBulletSpeed;
                        b1.vy = Math.sin(currentFrame/60) * enemyBulletSpeed;
                
                        b2 = new component(enemies[i].x, enemies[i].y, 30, 30, "#454138");
                        b2.vx = Math.cos(currentFrame/60) * -enemyBulletSpeed;
                        b2.vy = Math.sin(currentFrame/60) * -enemyBulletSpeed;
                
                        b3 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b3.vx = Math.sin(currentFrame/60) * enemyBulletSpeed;
                        b3.vy = Math.cos(currentFrame/60) * -enemyBulletSpeed;
                
                        b4 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b4.vx = Math.sin(currentFrame/60) * -enemyBulletSpeed;
                        b4.vy = Math.cos(currentFrame/60) * enemyBulletSpeed;

                        
                        enemyBullets.push(b1);
                        enemyBullets.push(b2);
                        enemyBullets.push(b3);
                        enemyBullets.push(b4);
                        break; 
                    case "rotcurvedopposite":
                        b1 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b1.vx = Math.cos(currentFrame/60) * enemyBulletSpeed;
                        b1.vy = Math.sin(currentFrame/60) * enemyBulletSpeed;
                        
                        b2 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b2.vx = Math.cos(currentFrame/60) * -enemyBulletSpeed;
                        b2.vy = Math.sin(currentFrame/60) * -enemyBulletSpeed;
                        
                        b3 = new component(enemies[i].x, enemies[i].y, 30, 30, "#454138");
                        b3.vx = Math.sin(currentFrame/60) * enemyBulletSpeed;
                        b3.vy = Math.cos(currentFrame/60) * -enemyBulletSpeed;
                        
                        b4 = new component(enemies[i].x, enemies[i].y, 30, 30, "#454138");
                        b4.vx = Math.sin(currentFrame/60) * -enemyBulletSpeed;
                        b4.vy = Math.cos(currentFrame/60) * enemyBulletSpeed;
                        
                        enemyBullets.push(b1);
                        enemyBullets.push(b2);
                        enemyBullets.push(b3);
                        enemyBullets.push(b4);
                        break;            
                    case "hexashot":
                        b1 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b1.vx = enemyBulletSpeed;
                
                        b2 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b2.vx = -enemyBulletSpeed;
                
                        b3 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b3.vx = Math.sin(2.36) * enemyBulletSpeed;
                        b3.vy = Math.cos(2.36) * enemyBulletSpeed;
                
                        b4 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b4.vx = Math.sin(0.79) * enemyBulletSpeed;
                        b4.vy = Math.cos(0.79) * enemyBulletSpeed;

                        b5 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b5.vx = Math.sin(3.93) * enemyBulletSpeed;
                        b5.vy = Math.cos(3.93) * enemyBulletSpeed;

                        b6 = new component(enemies[i].x, enemies[i].y, 30, 30, "#F34D08");
                        b6.vx = Math.sin(5.5) * enemyBulletSpeed;
                        b6.vy = Math.cos(5.5) * enemyBulletSpeed;

                        enemyBullets.push(b1);
                        enemyBullets.push(b2);
                        enemyBullets.push(b3);
                        enemyBullets.push(b4);
                        enemyBullets.push(b5);
                        enemyBullets.push(b6);
                        break;

                    case "playershot":
                        direction = [player.x - enemies[i].x, player.y - enemies[i].y];
                        magnitude = Math.sqrt(direction[0]*direction[0] + direction[1]*direction[1]);
                        normalizedDx = direction[0]/magnitude;
                        normalizedDy = direction[1]/magnitude;

                        b1 = new component(enemies[i].x, enemies[i].y, 30, 30, enemyBulletColor);
                        b1.vx = enemyBulletSpeed * normalizedDx;
                        b1.vy = enemyBulletSpeed * normalizedDy;

                        enemyBullets.push(b1);
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
            startGame();
        }
    }

    gameArea.scoreText.update();
}

function movePlayer(vx, vy) {
    playerPiece.vx = vx;
    playerPiece.vy = vy;
}

window.onload = gameArea.setup();