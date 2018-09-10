class PongBall extends PongObject
{
    constructor(radius, color, emissive = 0x000000)
    {
        super();

        var geo = new THREE.SphereGeometry(radius, 32, 32);
        var mat = new THREE.MeshPhongMaterial({ color: color, shininess: 0, emissive: emissive });
        
        this.ball = new THREE.Mesh(geo, mat);
        this.velocity = new THREE.Vector3(); // movement vector
        this.sphere = new THREE.Sphere(this.ball.position, radius); // collision sphere used for collisions
        this.collidableBoxes = []; // all collidable objects that contain a box property
        this.callback = undefined; // called when sphere collides with an object

        // Ball properties
        this.ball.castShadow = true;
        this.ball.receiveShadow = true;

        this.group.add(this.ball);
    }

    setPosition(x, y, z)
    {
        this.ball.position.set(x, y, z);
    }

    setCollidableBoxes(collidableBoxes, callback = undefined)
    {
        this.collidableBoxes = collidableBoxes;
        this.callback = callback;
    }

    setVelocity(speed, bearing, elevation)
    {
        this.velocity.x = speed * Math.cos(bearing) * Math.cos(elevation);
        this.velocity.y = speed * Math.sin(elevation);
        this.velocity.z = speed * Math.sin(bearing) * Math.cos(elevation);
    }

    setDirection(vector)
    {
        // Change direction while keeping the same speed
        var v = vector.clone().setLength(this.velocity.length());
        this.velocity.set(v.x, v.y, v.z);
    }

    adjustSpeed(delta, maxSpeed)
    {
        // Change speed while keeping the same direction
        var speed = Math.min(this.velocity.length() + delta, maxSpeed);
        this.velocity.setLength(speed);
    }

    bounce(surfaceNormal)
    {
        this.velocity.reflect(surfaceNormal);
    }

    update()
    {
        // Move the ball
        // Normally I would used delta time, but just gonna move frame by frame
        var maxSeg = this.sphere.radius * 1.9;
        var speed = this.velocity.length();
        var segVel = this.velocity.clone();

        var collided = false;

        // Break up the velocity into segments no larget that the diameter of the sphere
        // I do this so that the ball can't simply jump over a collision if the speed is too fast

        while (speed > 0 && !collided)
        {
            // Grab the next segment, move, check for collisions
            var seg = Math.min(speed, maxSeg);
            speed -= seg;

            this.ball.position.add(segVel.setLength(seg));

            var obj;

            // Check each box for a collision
            for (let i in this.collidableBoxes)
            {
                obj = this.collidableBoxes[i];

                if (this.sphere.intersectsBox(obj.box))
                {
                    collided = true;

                    // Move out of the collisions
                    // Kind of a shitty way to do it... but oh well
                    var v = obj.box.normal.clone().setLength(maxSeg * 0.1);

                    while (this.sphere.intersectsBox(obj.box))
                    {
                        this.ball.position.add(v);
                    }

                    if (this.callback) this.callback(obj);
                }
            }
        }
    }
}