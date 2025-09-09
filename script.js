class Player {
    constructor(game){
        this.game = game;
        this.width = 140;
        this.height = 120;
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = this.game.height - this.height;
        this.speed = 5;
        this.lives = 5;
        this.maxLives = 10;
        this.image = document.getElementById('player');
        this.jets_image = document.getElementById('player_jets');
        this.frameX = 0;
        this.jestFrame = 1;
    }
    draw(context){
        
        // --- handle sprite frame
        this.game.keys.indexOf('1') > -1 || this.game.keys.indexOf('Alt') ? this.frameX = 1 : this.frameX = 0;        
        context.drawImage(this.jets_image, this.jestFrame * this.width, 0, this.width, 
            this.height, this.x, this.y, this.width, this.height);  
        
        context.drawImage(this.image, this.frameX * this.width, 0, this.width, 
            this.height, this.x, this.y, this.width, this.height);
    }

    update(){
        // horizontal movement 
        if(this.game.keys.indexOf('ArrowLeft') > -1) {
            this.x -= this.speed; 
            this.jestFrame = 0;
        }
        else if(this.game.keys.indexOf('ArrowRight') > -1) {
            this.x += this.speed; 
            this.jestFrame = 2;
    } else{
        this.jestFrame = 1;
    }

        //horizontal boundaries
        if(this.x < -this.width * 0.5) this.x = -this.width * 0.5;
        else if (this.x > this.game.width - this.width * 0.5) this.x = this.game.width - this.width * 0.5;
    }
    shoot(){
        const projectile = this.game.getProjectile();
        if(projectile) projectile.start(this.x + this.width * 0.5, this.y);
    }

    restart(){
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = this.game.height - this.height;
        this.lives = 5;
    }

}

class Projectile {
    constructor(){
        this.width = 3;
        this.height = 20;
        this.x = 0;
        this.y = 0;
        this.speed = 20;
        this.free = true;       
    }

    draw(context){
        if (!this.free){
            context.save();
            context.fillStyle = '#FFC900'
            context.fillRect(this.x, this.y, this.width, this.height);
            context.restore();
        }
    }
    update(){
        if(!this.free){
            this.y -= this.speed;
            if(this.y < -this.height) this.reset();
        }
    }
    start(x, y){
        this.x = x - this.width * 0.5;
        this.y = y;
        this.free = false;
    }
    reset(){
        this.free = true;
    }
}

class Enemy {
    constructor(game, positionX, positionY){
        this.game = game;
        this.width = this.game.enemySize;
        this.height = this.game.enemySize;
        this.x = 0;
        this.y = 0;
        this.positionX = positionX;
        this.positionY = positionY;
        this.markedForDeletion = false;
    }
    draw(context){
        //removes the boxes
        //context.strokeRect(this.x, this.y, this.width, this.height);
        context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, 
            this.height, this.x, this.y, this.width, this.height);
    }

    update(x, y){
        this.x = x + this.positionX;
        this.y = y + this.positionY;
        // check collision enemies - projectiles
        this.game.projectilesPool.forEach( projectile => {
            if(!projectile.free && this.game.checkCollision(this, projectile) && this.lives > 0){
              this.hit(1);
              projectile.reset();               
              
            }
        });

        // Set up an explosion
        if(this.lives < 1){
            if (this.game.spriteUpdate) this.frameX++;
            if(this.frameX > this.maxFrame){
                this.markedForDeletion = true;
                if(!this.game.gameOver) this.game.score += this.maxLives;
            }
        }

        // check collision enemies - player

        if(this.game.checkCollision(this, this.game.player) && this.lives > 0){
           this.lives = 0;
           this.game.player.lives--;
            if(this.game.player.lives < 1) this.game.gameOver = true;
        }

        //lose condition
        if(this.y + this.height > this.game.height || this.game.player.lives < 1){
            this.game.lives = 0;
            this.game.player.lives--;
        }
    }

    hit(damage){
        this.lives -= damage;
    }
    
}

// Enemy types - sub classes of Enemy
class Beetlemorph extends Enemy {

    constructor(game, positionX, positionY){
        super(game, positionX, positionY);
        this.image = document.getElementById('beetlemorph');
        this.frameX = 0;
        this.frameY = Math.floor(Math.random() * 4);
        this.maxFrame = 2;
        this.lives = 1;
        this.maxLives = this.lives;   
    }
}

class Wave {
    constructor(game){
        this.game = game;
        this.height = this.game.rows * this.game.enemySize;
        this.width = this.game.columns * this.game.enemySize;
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = -this.height;
        this.speedX = Math.random() < 0.5 ? -1 : 1;
        this.speedY = 0;
        this.enemies = [];
        this.nextWaveTrigger = false;
        this.create();
    }
    render(context){
        if(this.y < 0) this.y += 5;
        this.speedY = 0;        
        
        if(this.x < 0 || this.x > this.game.width - this.width){
            this.speedX *= -1;
            this.speedY = this.game.enemySize;
        }
        this.x += this.speedX;
        this.y += this.speedY;
        this.enemies.forEach( enemy => {
            enemy.update(this.x, this.y);
            enemy.draw(context);
        })

        this.enemies = this.enemies.filter( object => !object.markedForDeletion);
    }
    create(){
        for (let y = 0; y < this.game.rows; y++){
            for(let x = 0; x < this.game.columns; x++){
                let enemyX = x * this.game.enemySize;
                let enemyY = y * this.game.enemySize;
                this.enemies.push(new Beetlemorph(this.game, enemyX, enemyY))
            }
        }
    }
}

class Game {
    constructor(canvas){
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.keys = [];
        this.player = new Player(this);

        this.projectilesPool = [];
        this.noOfProjectiles = 15;
        this.createProjectiles(); 
        this.fired = false;      
        
        // Waves of enemies

        this.columns = 2;
        this.rows = 2;
        this.enemySize = 80;

        this.waves = [];
        this.waves.push(new Wave(this));
        this.waveCount = 1;

        //---- Let's add some sprites

        this.spriteUpdate = false;
        this.spriteTimer = 0;
        this.spriteInterval = 150;

        this.score = 0;
        this.gameOver = false;

        addEventListener('keydown', (e) => {
            //console.log(e);
            //console.log(e.key);
            if( this.keys.indexOf(e.key) === -1){
                this.keys.push(e.key);
               
            }
            // shoot key '1' to 'spacebar'
            if((e.key === 'Alt' || e.key === '1') && !this.fired) this.player.shoot();
            this.fired = true;            

            if(e.key === 'r' && this.gameOver) this.restart();
            
        });

        addEventListener('keyup', (e) => {
            this.fired = false;
            const index = this.keys.indexOf(e.key);
            if (index > -1){ 
                this.keys.splice(index, 1);               
            }

        });
    }

    render(context, deltaTime){

       //---sprite timer
        if (this.spriteTimer > this.spriteInterval){
            this.spriteUpdate = true;
            this.spriteTimer = 0;
        }else{
            this.spriteUpdate = false;
            this.spriteTimer += deltaTime;
        }

        //Score made behind enemies
        this.drawStatusText(context);
        this.projectilesPool.forEach( projectile => {

            projectile.update();
            projectile.draw(context);
        })
        this.player.draw(context);
        this.player.update();
       

        this.waves.forEach( wave => {
            wave.render(context);
            if(wave.enemies.length < 1 && !wave.nextWaveTrigger && !this.gameOver){
                this.newWave();
                this.waveCount++;
                wave.nextWaveTrigger = true;
                if (this.player.lives < this.player.maxLives) this.player.lives++;
            }
        })
    }
    // create projectiles object pool
    createProjectiles(){
        for (let i = 0; i < this.noOfProjectiles; i++){
            this.projectilesPool.push(new Projectile());
        }
    }
    // get free projectile object from the pool
    getProjectile(){
        for(let i=0; i<this.projectilesPool.length; i++){
            if(this.projectilesPool[i].free){
                return this.projectilesPool[i];
            }
        }
    }
    // collision detection between 2 rectangles
    checkCollision(a, b){
        
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        )
    }

    drawStatusText(context){
        context.save();
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.shadowColor = '#000'
        context.fillText(`Score: ${this.score}` , 20, 40);
        context.fillText(`Wave: ${this.waveCount}`, 475, 40);

        // Life Bar ----

         for (let i=0; i< this.player.maxLives; i++){
            if (this.player.lives >= 4)context.fillStyle = '#78C841';
            else if (this.player.lives === 3) context.fillStyle = '#FFE31A';
            else context.fillStyle = '#E62727';
            
            context.strokeRect(20 + 20 * i, 100, 10, 15);
        }

        for (let i=0; i< this.player.lives; i++){
            if (this.player.lives >= 4)context.fillStyle = '#78C841';
            else if (this.player.lives === 3) context.fillStyle = '#FFE31A';
            else context.fillStyle = '#E62727';
            
            context.fillRect(20 + 20 * i, 100, 10, 15);
        }
        
        if(this.gameOver){
            context.textAlign = 'center';
            context.font = '85px Impact';
            context.fillText('GAME OVER! 👾', this.width * 0.5, this.height * 0.5);
            context.font = '20px Impact';
            context.fillText('Press R to restart. 🕹️', this.width * 0.5, this.height * 0.5 + 30);
            context.fillStyle = '#fff'
        }
        context.restore();
    }

    newWave(){

        if( Math.random() < 0.5 && this.columns * this.enemySize < this.width * 0.8){
            this.columns++;
        }else if(this.rows * this.enemySize < this.height * 0.6){
            this.rows++;
        }     
        this.waves.push(new Wave(this));
    }

    restart(){
        this.player.restart();

         // Waves of enemies
        this.columns = 2;
        this.rows = 2;     
        this.waves = [];
        this.waves.push(new Wave(this));
        this.waveCount = 1;
        this.score = 0;
        this.gameOver = false;
    }
}

window.addEventListener('load', function() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 800;
    ctx.fillStyle = '#F8F3CE';
    ctx.strokeStyle = '#F3E9DC';
    //ctx.lineWidth = 5;
    ctx.font = '30px Impact';
    
    const game = new Game(canvas);
    let lastTime = 0;
    const animate = (timeStamp) => {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.render(ctx, deltaTime);
        requestAnimationFrame(animate);
    }
    animate(0);
    
});