var Direction = require('../../common/Direction')

class ExampleEntity extends PIXI.Container {
    constructor(entity) {
        super()
        this.x = entity.x
        this.y = entity.y
        this.isMoving = entity.isMoving
        this.facing = entity.facing

        this.sprite = new PIXI.Sprite.fromFrame('guy/down-idle0.png')
        this.sprite.anchor.x = this.sprite.anchor.y = 0.5
        this.addChild(this.sprite)
        
        this.animationFrame = 0
        this.accumulator = 0
    }

    update(delta) {

        // verbose demonstration of frame-rate-independent animation logic
        if (this.isMoving) {
            this.accumulator += delta

            if (this.accumulator > 0.150) {
                this.animationFrame++
                if (this.animationFrame > 3) {
                    this.animationFrame = 0
                }

                if (this.facing === Direction.DOWN) {
                    this.sprite.texture = new PIXI.Texture.fromFrame('guy/down-walk' + this.animationFrame + '.png')
                } else if (this.facing === Direction.UP) {
                    this.sprite.texture = new PIXI.Texture.fromFrame('guy/up-walk' + this.animationFrame + '.png')
                } else if (this.facing === Direction.RIGHT) {
                    this.sprite.texture = new PIXI.Texture.fromFrame('guy/right-walk' + this.animationFrame + '.png')
                } else if (this.facing === Direction.LEFT) {
                    this.sprite.texture = new PIXI.Texture.fromFrame('guy/left-walk' + this.animationFrame + '.png')
                }

                this.accumulator = 0
            }
        } else {
            this.accumulator += delta

            if (this.accumulator > 0.600) {
                this.animationFrame++
                if (this.animationFrame > 1) {
                    this.animationFrame = 0
                }

                if (this.facing === Direction.DOWN) {
                    this.sprite.texture = new PIXI.Texture.fromFrame('guy/down-idle' + this.animationFrame + '.png')
                } else if (this.facing === Direction.UP) {
                    this.sprite.texture = new PIXI.Texture.fromFrame('guy/up-idle' + this.animationFrame + '.png')
                } else if (this.facing === Direction.RIGHT) {
                    this.sprite.texture = new PIXI.Texture.fromFrame('guy/right-idle' + this.animationFrame + '.png')
                } else if (this.facing === Direction.LEFT) {
                    this.sprite.texture = new PIXI.Texture.fromFrame('guy/left-idle' + this.animationFrame + '.png')
                } 

                this.accumulator = 0
            } 
        }
    }
}

module.exports = ExampleEntity