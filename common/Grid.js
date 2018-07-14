class Grid {
    constructor(width, height) {
        this.width = width
        this.height = height
        this.cells = []
    }

    fill(value) {
        for (var i = 0; i < this.width * this.height; i++) {
            this.cells.push(0)
        } 
    }

    // converts 2D coords to 1D index
    getIndex(x, y) {
        return x + this.width * y
    }

    // converts 1D index to 2D coords
    getXY(index) {
        return {
            x: index % this.width,
            y: Math.floor(index / this.width)
        }
    }

    boundsCheck(x, y) {
        return (x >= 0 && x < this.width && y >= 0 && y < this.height)
    }

    set(x, y, value) {
        if (!this.boundsCheck(x,y)) {
            return null
        }      
        this.cells[this.getIndex(x, y)] = value
        return value
    }

    get(x, y) {
        if (!this.boundsCheck(x,y)) {
            return null
        }
        return this.cells[this.getIndex(x, y)]
    }

    toArray() {
        return this.cells
    }
}

module.exports = Grid