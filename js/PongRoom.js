class PongRoom extends PongObject
{
    constructor(width, height, depth, wallColor, floorColor, ceilingColor)
    {
        super();

        var geo = new THREE.BoxGeometry(1, 1, 1);
        var mat = new THREE.MeshPhongMaterial({ color: wallColor, shininess: 100, specular: 0xFFFFFF });
        var thickness = 0.1;

        this.width = width;
        this.height = height;
        this.depth = depth;
        
        this.left = new THREE.Mesh(geo, mat);
        this.right = new THREE.Mesh(geo, mat.clone());
        this.floor = new THREE.Mesh(geo, mat.clone());
        this.ceiling = new THREE.Mesh(geo, mat.clone());
    
        // Left wall
        this.left.scale.set(thickness, height, depth);
        this.left.position.x -= width / 2;
        this.left.receiveShadow = true;

        // Right wall
        this.right.scale.set(thickness, height, depth);
        this.right.position.x += width / 2;
        this.right.receiveShadow = true;

        // Floor
        this.floor.scale.set(thickness, width + thickness, depth);
        this.floor.position.y -= (height + thickness) / 2;
        this.floor.rotateZ(0.5 * Math.PI);
        this.floor.material.color.set(floorColor);
        this.floor.receiveShadow = true;

        // Ceiling
        this.ceiling.scale.set(thickness, width + thickness, depth);
        this.ceiling.position.y += (height + thickness) / 2;
        this.ceiling.rotateZ(0.5 * Math.PI);
        this.ceiling.material.color.set(ceilingColor);
        this.ceiling.receiveShadow = true;

        // Add bounding boxes
        this.left.box = new THREE.Box3().expandByObject(this.left);
        this.right.box = new THREE.Box3().expandByObject(this.right);
        this.floor.box = new THREE.Box3().expandByObject(this.floor);
        this.ceiling.box = new THREE.Box3().expandByObject(this.ceiling);

        this.left.box.normal = new THREE.Vector3(1, 0, 0);
        this.right.box.normal = new THREE.Vector3(-1, 0, 0);
        this.floor.box.normal = new THREE.Vector3(0, 1, 0);
        this.ceiling.box.normal = new THREE.Vector3(0, -1, 0);

        // Place objects in group
        this.group.add(this.left);
        this.group.add(this.right);
        this.group.add(this.floor);
        this.group.add(this.ceiling);
    }
}
