class Game{
    constructor(){
        this._canvas = document.createElement("canvas");
        this._ctx = this._canvas.getContext("2d");
        document.body.appendChild(this._canvas);
        this._canvas.width = 1200;
        this._canvas.height = 640;
        this._canvas.style.backgroundColor = "black";

        this._gameEntities = [];
        this._player = null;
        this._keyOn = {
            player : 0,
            loggedKeys: []
        };
        this._pressOn = 0;
        this._pressDelay = 105;
        this._pressAnimDuration = 20;
        this._pressLocation = {x:0,y:0};
        this._canvasListen = document.querySelector('canvas');
        this._dashOn = 0;
        this._dashDelay = this._pressAnimDuration;
        this._trailParticles = [];
        this._impactParticles = {
            life: 0,
            x: 0, y:0,
        }
        this._collisionParticles = [];
        this._gameStart = 0;
        this._enemyKill = 0;
        this.preLoadAssets();
    }
    preLoadAssets(){
        this._fontNo = document.createElement("img");
        this._fontNo.src = "assets/img/fazer-number.png";
        this._uiIcon = document.createElement("img");
        this._uiIcon.src = "assets/img/fazer-ui.png";
        this._displayRestart = document.createElement("img");
        this._displayRestart.src = "assets/img/fazer-restart.png";
        this._displayController = document.createElement("img");
        this._displayController.src = "assets/img/fazer-controller.png";
        this._displayStart = document.createElement("img");
        this._displayStart.src = "assets/img/fazer-begin.png";
        this._sfxDash = new Audio();
        this._sfxDash.src = "assets/sfx/dash.wav";
        this._bgm = new Audio();
        this._bgm.src = "assets/bgm/Enigma.wav";
        this._bgm.loop = true;
        this._ctx.imageSmoothingEnabled = false;
        this._displayController.onload = () => {
            this._ctx.drawImage(this._displayController, 0, 0, 70, 22, (this._canvas.width / 2) - 70, (this._canvas.height / 2) - 50, 135, 44);
        };
        this._displayStart.onload = () => {
            this._ctx.drawImage(this._displayStart, 0, 0, 124, 9, (this._canvas.width / 2) - 112, (this._canvas.height / 2) + 9, 215, 16);
        };
        this._allowStart = 1;
    }
    createEntity(param){
        let entity = new Entity(param);
        this._gameEntities.push(entity);
        if (param["type"] == "player"){
            this._player = entity;
        }
    }
    beginGame(){
        this.update();
    }
    randomizeSpawn(){
        let returnParam = [];
        returnParam["xSpawn"] = Math.floor(Math.random() * this._canvas.width - 64) + 64;
        returnParam["ySpawn"] = Math.floor(Math.random() * this._canvas.height - 64) + 64;
        return returnParam;
    }
    logKey(param){
        if (this._keyOn.loggedKeys.find(element => element == param["direction"]) == undefined){
            this._keyOn.loggedKeys.push(param["direction"]);
        }

        if (param["type"] == "movement"){
            if (this._dashOn == 0 && this._player._draw == 1){
                this._keyOn["player"] = 1;
                param["canvasWidth"] = this._canvas.width;
                param["canvasHeight"] = this._canvas.height;
                param["loggedKeys"] = this._keyOn.loggedKeys;
                this._player.move(param);
            }
        }
    }
    async update(){
        if (this._keyOn["player"] == 0){
            if (this._player != null){
                this._player._curFrame = 1;
                if (this._player._curFace == 2){
                    this._player._curFace = 0;
                }
            }
        }
        this._keyOn["player"] = 0;
        if (this._gameStart == 0){
            this._gameStart = 1;
            setTimeout(()=>{this.update()},10);
            this._bgm.play();
        }
        else{
            this._keyOn.loggedKeys = [];
            if (this._pressOn == 1){
                this._pressDelay--;
                if (this._pressLocation["x"] != 0 && this._pressLocation["y"] != 0){
                    this._pressAnimDuration--;
                }
                if (this._pressDelay <= 0){
                    this._pressOn = 0;
                    this._pressDelay = 105;
                }
            }
            if (this._dashOn == 1){
                this._dashDelay--;
                let param = [];
                param["location"] = this._pressLocation;
                param["animDuration"] = this._pressAnimDuration;
                let prevValue = this._player.dash(param);
                let particleIndex = 0;
                let checkParticleIndex = null;
                this._trailParticles.forEach((particle)=>{
                    if (particle == null){
                        checkParticleIndex = particleIndex;
                    }
                    particleIndex++;
                });
                if (checkParticleIndex == null){
                    this._trailParticles.push({
                        x: prevValue["x"] + 32, y: prevValue["y"] + 32,
                        life: 8
                    });
                }
                else{
                    this._trailParticles[checkParticleIndex] = {
                        x: prevValue["x"] + 32, y: prevValue["y"] + 32,
                        life: 8
                    }
                }
                
            }
            if (this._impactParticles["life"] > 0){
                this._impactParticles["life"] -- ;
            }
            if (this._pressAnimDuration <= 0){
                this._pressLocation = {x:0,y:0};
                this._pressAnimDuration = 20;
                this._dashDelay = 0;
                this._dashOn = 0;
                this._impactParticles = {
                    life: 20,
                    x: this._player._x, y: this._player._y
                }
            }

            let decideSpawn = Math.floor(Math.random() * 100) + 1;
            if (decideSpawn > 98 && this._player._draw == 1){
                let randomNoSpawn = Math.round(this._enemyKill / 100);
                let totalSpawn = 1 + randomNoSpawn;
                while(totalSpawn > 0){
                    let spawnValues = this.randomizeSpawn();
                    this.createEntity({
                        img:{
                            file: "fazer-enemy.png",
                        },
                        type: "enemy",
                        x: spawnValues["xSpawn"], y: spawnValues["ySpawn"]
                    });

                    totalSpawn--;
                }
            }

            /** Enemy AI */
            this._gameEntities.forEach((enemy)=>{
                if (enemy._entityType != "player" && enemy._draw == 1){
                    enemy.ai({targetX: this._player._x, targetY: this._player._y, canvasWidth: this._canvas.width, canvasHeight: this._canvas.height });
                }
            });

            let collisionIndex = 0;
            this._collisionParticles.forEach((particle)=>{
                particle["life"]--;
                if (particle["life"] <= 0){
                    this._collisionParticles[collisionIndex] = [];
                }
                collisionIndex++;
            });
            await this.collision();
            await this.renderAssets();
            let particleIndex = 0;
            this._trailParticles.forEach((particle)=>{
                if (particle != null){
                    particle["life"]--;
                    if (particle["life"] <= 0){
                        this._trailParticles[particleIndex] = [];
                    }
                    particleIndex++;
                }
            });
            setTimeout(()=>{this.update()},24);
        }
    }
    async collision(){
        let impactXBullets = [];
        let impactYBullets = [];
        if (this._impactParticles["life"] > 0){
            let distance = 21 - this._impactParticles["life"];
            let direction = [[1,0],[0,1],[-1,0],[0,-1],[1,-1],[1,1],[-1,1],[-1,-1]];
            direction.forEach((angle,key)=>{
                let impactX = this._impactParticles["x"] + 16;
                let impactY = this._impactParticles["y"] + 16; 
                let multiplier = key < 4 ? 10 : 5;
                let distanceOverall = distance;
                if (angle[0] == 1){
                    impactX += multiplier * distanceOverall;
                }
                else if (angle[0] == -1){
                    impactX -= multiplier * distanceOverall;
                }
                if (angle[1] == 1){
                    impactY += multiplier * distanceOverall;
                }
                else if (angle[1] == -1){
                    impactY -= multiplier * distanceOverall;
                }
                impactXBullets.push(impactX);
                impactYBullets.push(impactY);
            });
        }
        let playerCollisionX = 0;
        let playerCollisionY = 0;
        this._gameEntities.forEach((entity)=>{
            if (entity._draw == 1){
                if (entity._entityType == "enemy" && entity._spawnDelay == 0){
                    let collisionX = 0;
                    let collisionY = 0;
                    let collisionXSplat = null;
                    let collisionYSplat = null;
                    impactXBullets.forEach((x)=>{
                        if (x >= entity._x && x <= entity._x + 64){
                            collisionX++;
                        }
                        else if (x+5 >= entity._x && x+5 <= entity._x + 64){
                            collisionX++;
                        }
                    });
                    impactYBullets.forEach((y)=>{
                        if (y >= entity._y && y <= entity._y + 64){
                            collisionY++;
                        }
                        else if (y+5 >= entity._y && y+5 <= entity._y + 64){
                            collisionY++;
                        }
                    });
                    if (collisionY > 0 && collisionX > 0){
                        entity._draw = 0;
                        collisionXSplat = entity._x + 32;
                        collisionYSplat = entity._y + 32;
                        this._enemyKill++;
                        entity._sfxExplode.play();
                    }
                    else if (this._dashOn == 0 && this._player._draw == 1){
                        let checkX = 0;
                        let checkY = 0;
                        if (this._player._x >= entity._x && this._player._x <= entity._x + 64){
                            checkX++;
                        }
                        else if (this._player._x + 64 >= entity._x && this._player._x  + 64 <= entity._x + 64){
                            checkX++;
                        }

                        if (this._player._y >= entity._y && this._player._y <= entity._y + 64){
                            checkY++;
                        }
                        else if (this._player._y + 64 >= entity._y && this._player._y  + 64 <= entity._y + 64){
                            checkY++;
                        }
                        if (checkX > 0 && checkY > 0){
                            playerCollisionX = 1; 
                            playerCollisionY = 1;
                            collisionXSplat = this._player._x + 32;
                            collisionYSplat = this._player._y + 32;
                        }
                    }

                    if (collisionXSplat != null && collisionYSplat != null){
                        let particleIndex = 0;
                        let checkIndex = null;
                        this._collisionParticles.forEach((particle)=>{
                            if (particle == null){
                                checkIndex = particleIndex;
                            }
                            particleIndex++;
                        });
                        if (checkIndex == null){
                            this._collisionParticles.push({
                                x: collisionXSplat, y: collisionYSplat,
                                life: 40
                            });
                        }
                        else{
                            this._collisionParticles[checkIndex] = {
                                x: collisionXSplat, y: collisionYSplat,
                                life: 40
                            }
                        }
                    }
                }
                else{
                    entity._spawnDelay--;
                }
            }
        });
        if (playerCollisionX > 0 && playerCollisionY > 0){
            this._player._draw = 0;
            this._player._sfxExplode.play();
        }
    }
    async renderAssets(){
        this._ctx.clearRect(0,0,this._canvas.width,this._canvas.height);
        this._ctx.imageSmoothingEnabled = false;
        this._trailParticles.forEach((particle)=>{
            this._ctx.beginPath();
            this._ctx.arc(particle["x"],particle["y"],particle["life"],0, 2*Math.PI);
            this._ctx.fillStyle = "white";
            this._ctx.fill();
        });
        this._ctx.save();
        this._gameEntities.forEach((entity)=>{
            if (this._player._draw == 1){
                if (entity._draw == 1){
                    if (entity._entityType == "enemy" && entity._spawnDelay > 0){
                        this._ctx.shadowBlur = 10;
                        this._ctx.shadowColor = "white";
                    }
                    this._ctx.drawImage(entity._sprite, entity._curFrame * 32, entity._curFace * 32, 32, 32, entity._x, entity._y, 64, 64);
                }
            }
        });
        this._ctx.restore();
        this._ctx.globalAlpha = 1;
        this._ctx.save();
        this._ctx.shadowBlur = 10;
        this._ctx.shadowColor = "white";

        if (this._impactParticles["life"] > 0){
            let distance = 21 - this._impactParticles["life"];
            let direction = [[1,0],[0,1],[-1,0],[0,-1],[1,-1],[1,1],[-1,1],[-1,-1]];
            direction.forEach((angle,key)=>{
                let impactX = this._impactParticles["x"] + 16;
                let impactY = this._impactParticles["y"] + 16; 
                let multiplier = key < 4 ? 10 : 5;
                let distanceOverall = distance;
                if (angle[0] == 1){
                    impactX += multiplier * distanceOverall;
                }
                else if (angle[0] == -1){
                    impactX -= multiplier * distanceOverall;
                }
                if (angle[1] == 1){
                    impactY += multiplier * distanceOverall;
                }
                else if (angle[1] == -1){
                    impactY -= multiplier * distanceOverall;
                }
                this._ctx.beginPath();
                this._ctx.arc(impactX,impactY,5,0, 2*Math.PI);
                this._ctx.fillStyle = "white";
                this._ctx.fill();
            });
        }

        this._collisionParticles.forEach((particle)=>{
            if (particle["life"] > 0){
                let distance = 41 - particle["life"];
                let particleArray = [
                    [0,-2],[0,3],[-4,-1],[-7,0],[-1,5],[8,0],[3,2],[-2,3],
                    [0,-32],[0,33],[-22,-28],[-25,0],[-23,39],[40,0],[41,40],[-24,28],
                ];
                let multipler = 2;
                particleArray.forEach((subparticle)=>{
                    this._ctx.fillStyle = "white";
                    let dirX = particle["x"];
                    let dirY = particle["y"];
                    if (subparticle[0] > 0){
                        dirX += (multipler * distance);
                        dirX += subparticle[0];
                    }
                    else if (subparticle[0] < 0){
                        dirX -= (multipler * distance);
                        dirX -= subparticle[0];
                    }
                    if (subparticle[1] > 0){
                        dirY += (multipler * distance);
                        dirY += subparticle[1];
                    }
                    else if (subparticle[1] < 0){
                        dirY -= (multipler * distance);
                        dirY -= subparticle[1];
                    }
                    this._ctx.globalAlpha = 1;
                    this._ctx.fillStyle = "white";
                    this._ctx.fillRect(dirX, dirY, 3, 3);
                });
                
            }
        });
        this._ctx.restore();
        if (this._pressAnimDuration < 20){
            let arcSize = (20 - this._pressAnimDuration) * 3;
            let lineWidth = 5;
            if (arcSize > 40){
                this._ctx.globalAlpha = 0.1;
                lineWidth = 13;
            }
            else if (arcSize > 30){
                this._ctx.globalAlpha = 0.5;
                lineWidth = 8;
            }
            
            this._ctx.beginPath();
            this._ctx.arc(this._pressLocation["x"],this._pressLocation["y"],arcSize,0, 2*Math.PI);
            this._ctx.lineWidth=lineWidth;
            this._ctx.strokeStyle="white";
            this._ctx.stroke();
        }

        /** UI */
        this._ctx.globalAlpha = 1;
        this._ctx.fillStyle = "white";
        let barWidth = this._pressDelay == 105 ? this._pressDelay : 105 - this._pressDelay;
        this._ctx.fillRect(50, 20, barWidth, 16);
        this._ctx.fillRect(50, 40, 111, 4);
        this._ctx.fillRect(159, 19, 4, 25);
        this._ctx.drawImage(this._uiIcon, 0, 0, 9, 9, 20, 20, 24, 24);
        this._ctx.drawImage(this._uiIcon, 9, 0, 9, 9, 190, 20, 24, 24);

        this._ctx.globalAlpha = 1;
        let addMargin = 16; 
        let fontXmargin = 200;
        let stringNum = this._enemyKill.toString();
        for (var i = 0, len = stringNum.length; i < len; i += 1) {
            addMargin += 2;
            fontXmargin += addMargin;
            this._ctx.drawImage(this._fontNo, stringNum.charAt(i) * 9, 0, 9, 9, fontXmargin, 20, 24, 24);
        }

        if (this._player != null){
            if (this._player._draw == 0){
                this._ctx.drawImage(this._displayRestart, 0, 0, 112, 9, (this._canvas.width / 2) - 112, (this._canvas.height / 2) - 9, 215, 16);
            }
        }
        
    }
    getCursorPosition(canvas, event) {
        let rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        this._pressOn = 1;
        this._dashOn = 1;
        this._pressLocation["x"] = x;
        this._pressLocation["y"] = y;
        this._sfxDash.play();
    }
}

class Entity{
    constructor(param){
        this._entityType = param["type"] ? param["type"] : "enemy";
        this._sprite = document.createElement("img");
        this._sprite.src = "assets/img/"+param["img"]["file"];
        this._moveSpeed = 2;
        this._draw = 1;
        this._x = param["x"] ? param["x"] : 200;
        this._y = param["y"] ? param["y"] : 200;
        if (param["type"] == "player"){
            this._curFrame = 1;
            this._maxFrame = 3;
        }
        else if (param["type"] == "enemy"){
            this._curFrame = 0;
            this._maxFrame = 1;
        }
        this._curFace = 0;
        this._frameDelay = 12;
        this._spawnDelay = 60;
        this._sfxExplode = new Audio();
        this._sfxExplode.src = "assets/sfx/explode.wav";
    }
    dash(param){
        let deduction = param["animDuration"];
        let returnParam = []
        returnParam["x"] = this._x;
        returnParam["y"] = this._y;
        if (param["location"]["x"] > this._x){
            this._x += ((param["location"]["x"] - this._x)/deduction);
            this._curFace = 2;
            this._curFrame = 1;
        }
        else if (param["location"]["x"] < this._x){
            this._x -= ((this._x - param["location"]["x"])/deduction);
            this._curFace = 2;
            this._curFrame = 0;
        }

        if (param["location"]["y"] > this._y){
            this._y += ((param["location"]["y"] - this._y)/deduction);
        }
        else if (param["location"]["y"] < this._y){
            this._y -= ((this._y - param["location"]["y"])/deduction);
        }
        return returnParam;
    }
    move(param){
        let checkMovementKeys = 0;
        if (param["loggedKeys"].length > 0){
            param["loggedKeys"].forEach((key)=>{
                if (key == "right" || key == "left" || key == "up" || key == "down"){
                    checkMovementKeys++;
                }
            });
        }
        let moveSpeed = this._moveSpeed;
        if (checkMovementKeys > 1){
            moveSpeed = 1.75;
        }
        let checkOverlap = 0;
        switch(param["direction"]){
            case "right":
                let overx = this._x + moveSpeed;
                this._curFace = 0;
                if (overx >= (param["canvasWidth"] - 64)){
                    checkOverlap++
                }
                if (checkOverlap == 0){
                    this._x = overx;
                }
                break;
            case "left":
                this._curFace = 1;
                let underx = this._x - moveSpeed;
                if (underx <= 0){
                    checkOverlap++;
                }
                if (checkOverlap == 0){
                    this._x = underx;
                }
                break;
            case "down":
                let overy = this._y + moveSpeed;
                if (overy >= (param["canvasHeight"] - 64)){
                    checkOverlap++
                }
                if (checkOverlap == 0){
                    this._y = overy;
                }
                break;
            case "up":
                let undery = this._y - moveSpeed;
                if (undery <= 0){
                    checkOverlap++
                }
                if (checkOverlap == 0){
                    this._y = undery;
                }
                break;
            default:
                break;
        }
        this._frameDelay--;
        if (checkMovementKeys > 1){
            this._frameDelay+=0.1;
        }
        if (this._frameDelay <= 0){
                this._curFrame++;
                if (this._curFrame >= this._maxFrame){
                    this._curFrame = 0;
                }
            this._frameDelay = 12;
        }
    }
    ai(param){
        if (param["targetX"] > this._x && this._x + this._moveSpeed + 64 < param["canvasWidth"]){
            this._x += this._moveSpeed;
        }
        else if (param["targetX"] < this._x && this._x - this._moveSpeed > 0){
            this._x -= this._moveSpeed;
        }
        if (param["targetY"] > this._y && this._y + this._moveSpeed + 64 < param["canvasHeight"]){
            this._y += this._moveSpeed;
        }
        else if (param["targetY"] < this._y && this._y - this._moveSpeed > 0){
            this._y -= this._moveSpeed;
        }
    }
}

function KeyboardController(keys, repeat) {
    var timers= {};
    document.onkeydown= function(event) {
        var key= (event || window.event).keyCode;
        if (!(key in keys)){return true;}
        if (!(key in timers)) {
            timers[key]= null;
            keys[key]();
            if (repeat!==0){timers[key]= setInterval(keys[key], repeat);}
        }
        return false;
    };
    document.onkeyup= function(event) {
        var key= (event || window.event).keyCode;
        if (key in timers) {
            if (timers[key]!==null){clearInterval(timers[key]);}
            delete timers[key];
        }
    };
    window.onblur= () => {
        for (key in timers){if (timers[key]!==null){clearInterval(timers[key]);}}
        timers= {};
    };
};

KeyboardController({
    87: () => {
        appGame.logKey({
            type: "movement",
            direction: "up"
        });
    },
    83: () => {
        appGame.logKey({
            type: "movement",
            direction: "down"
        });
    },
    65: () => {
        appGame.logKey({
            type: "movement",
            direction: "left"
        });
    },
    68: () => {
        appGame.logKey({
            type: "movement",
            direction: "right"
        });
    },
    13: () => {
        if (appGame._gameStart == 0 && appGame._allowStart == 1){
            appGame.beginGame();
        }
    },
    82: () => {
        if (appGame._player._draw == 0){
            location.reload();
        }
    } 
}, 12);

const appGame = new Game();

appGame._canvasListen.addEventListener('mousedown', function(e) {
    if (appGame._pressOn == 0 && appGame._player._draw == 1 && appGame._gameStart == 1){
        appGame.getCursorPosition(appGame._canvasListen, e);
    }
});

appGame.createEntity({
    img:{
        file: "fazer-player.png",
    },
    type: "player"
});