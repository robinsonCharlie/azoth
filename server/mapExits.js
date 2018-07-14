var exits = {}

exits['underworld.json'] = [

	// left cave exit
	{
		x: 35,
		y: 85,
		address: 'ws://localhost:8001',
		to: {
			x: 61,
			y: 13,
		}
	},

	// right cave exit
	{
		x: 63,
		y: 85,
		address: 'ws://localhost:8001',
		to: {
			x: 89,
			y: 13,
		}
	}
]

exits['overworld.json'] = [

	// left cave entrance
	{
		x: 61,
		y: 12,
		address: 'ws://localhost:8002',
		to: {
			x: 35,
			y: 84
		}
	},

	// right cave entrance
	{
		x: 89,
		y: 12,
		address: 'ws://localhost:8002',
		to: {
			x: 63,
			y: 84
		}
	}

]

module.exports = exits