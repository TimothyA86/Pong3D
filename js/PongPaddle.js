class PongPaddle extends PongObject
{
    constructor(width, height, color, opacity, zPosition = 0)
    {
        super();

        var geo = new THREE.PlaneGeometry(width, height);
        var mat = new THREE.MeshToonMaterial(
        {
            color: color,
            shininess: 0,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: opacity
        });
        
        this.paddle = new THREE.Mesh(geo, mat);
        this.box = new THREE.Box3(); // bounding box used for collisions
        this.initOpacity = opacity;
        this.routine = function* () {} (); // animation routine

        // Paddle properties
        var edges = new THREE.EdgesGeometry(geo);
        var lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color }));

        this.paddle.position.set(0, 0, zPosition);
        this.paddle.castShadow = true;
        this.paddle.receiveShadow = true;
        this.paddle.add(lines);

        // Box dimensions
        this.box.expandByObject(this.paddle);
        this.box.center = this.paddle.position;
        this.box.normal = new THREE.Vector3(0, 0, -Math.sign(this.box.center.z));

        this.group.add(this.paddle);
    }
    
    update()
    {
        this.routine.next();
    }

    setPosition(x, y)
    {
        var offset = new THREE.Vector3(x - this.paddle.position.x, y - this.paddle.position.y);
        
        this.paddle.position.x = x;
        this.paddle.position.y = y;
        this.box.translate(offset);
    }

    onContact()
    {
        this.routine = this.contactRoutine();
    }

    * contactRoutine()
    {
        // Set the opacity to full, then fade back to normal
        var counter = 0;
        this.paddle.material.opacity = 1;
        yield;

        while (this.paddle.material.opacity > this.initOpacity)
        {
            // Use a cos wave to give a smoother look
            this.paddle.material.opacity = Math.cos(0.5 * Math.PI * (counter++) / 50);
            yield;
        }

        this.paddle.material.opacity = this.initOpacity;
    }
}