"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { DragControls } from "three/examples/jsm/controls/DragControls.js";

const addCircle = (basket: THREE.Object3D) => {
  const boundingBox = new THREE.Box3().setFromObject(basket);
  const width = boundingBox.max.x - boundingBox.min.x;
  const height = boundingBox.max.y - boundingBox.min.y;
  const circleRadius = 2.5;

  // Is the suer data for circle position has not been set
  if (!basket.userData.circlePosition) {
    basket.userData.circlePosition = {
      x: -width / 2 + circleRadius,
      y: height / 2 - circleRadius,
    };
  }
  const { x, y } = basket.userData.circlePosition;
  // console.log(x, y);
  // console.log(width, height);

  if (y - circleRadius >= -height / 2) {
    if (x + circleRadius <= width / 2) {
      // console.log("ran");
      const circleGeometry = new THREE.CircleGeometry(circleRadius, 32);
      const circleMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // You can customize the color

      const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);

      circleMesh.position.set(x, y, 0);
      basket.add(circleMesh);

      basket.userData.circleCount++;

      basket.userData.circlePosition.x += circleRadius * 2;

      // Check if the new x position is greater than the width
      if (basket.userData.circlePosition.x > width / 2) {
        // if so, rerset the x position move y down a row
        basket.userData.circlePosition.x = -width / 2 + circleRadius;
        basket.userData.circlePosition.y -= circleRadius * 2;
      }
    }
  }
};

export const MainCanvas = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight
    );
    camera.position.z = 200;

    scene.background = new THREE.Color("#fff");

    // Create a camera
    renderer.setSize(window.innerWidth, window.innerHeight);

    const raycaster = new THREE.Raycaster();

    const canvasContainer = canvasContainerRef.current;
    if (canvasContainer) {
      canvasContainer.appendChild(renderer.domElement);
    }

    // -- Calculates the bottom left corner --
    const cameraPosition = camera.position.clone();
    const cameraDistance = cameraPosition.length(); // Distance from the origin (center of the scene)

    // Calculate the half-height of the view frustum
    const halfHeight =
      Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2.0) * cameraDistance;

    const halfWidth = halfHeight * camera.aspect;
    const bottomLeftPosition = new THREE.Vector3(
      -halfWidth,
      -halfHeight,
      -cameraDistance
    );

    // Create a rectangle
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const rect = new THREE.Mesh(geometry, material);
    scene.add(rect);
    rect.name = "rect";

    // Add a green button to sort the baskets
    const greenGeometry = new THREE.PlaneGeometry(10, 10);
    const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const greenRect = new THREE.Mesh(greenGeometry, greenMaterial);
    greenRect.position.set(
      bottomLeftPosition.x + 20,
      bottomLeftPosition.y + 80,
      0
    );
    scene.add(greenRect);
    rect.name = "greenRect";

    const mouse = new THREE.Vector2();

    const sortBasketsByCircleCount = () => {
      const baskets = scene.children.filter((basket) => {
        return basket.name === "basket";
      });

      // Sort the baskets by the number of circles
      const sortedBaskets = baskets.sort(
        (a, b) => a.userData.circleCount - b.userData.circleCount
      );

      // Calculate the total width and height needed to position the baskets
      let totalWidth = 0;
      let currentHeight = 0;
      const margin = 5; // Margin between baskets

      sortedBaskets.forEach((basket) => {
        const boundingBox = new THREE.Box3().setFromObject(basket);
        const width = boundingBox.max.x - boundingBox.min.x;
        const height = boundingBox.max.y - boundingBox.min.y;

        // Position the basket and update totalWidth and currentHeight
        basket.position.x = totalWidth + width / 2;
        basket.position.y = -currentHeight - height / 2;

        totalWidth += width + margin;

        // If the total width exceeds the viewport width, move to the next row
        if (totalWidth + width > window.innerWidth) {
          totalWidth = 0;
          currentHeight += height + margin;
        }
      });
    };

    const onCanvasClick = (event: MouseEvent) => {
      event.preventDefault();

      // Calculate the mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Check for intersections with the green button
      const intersects = raycaster.intersectObject(greenRect);

      if (intersects.length > 0) {
        sortBasketsByCircleCount();
        renderer.render(scene, camera);
      }
    };

    window.addEventListener("click", onCanvasClick);

    const resetRectPosition = () => {
      rect.position.set(
        bottomLeftPosition.x + 20,
        bottomLeftPosition.y + 40,
        0
      );
    };
    resetRectPosition();

    // Create a ball
    const ball = new THREE.CircleGeometry(2.5, 32);
    const materialBall = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const ballMesh = new THREE.Mesh(ball, materialBall);
    ballMesh.name = "ball";

    const resetBallPosition = () => {
      ballMesh.position.set(
        bottomLeftPosition.x + 20,
        bottomLeftPosition.y + 20,
        0
      );
    };
    resetBallPosition();
    scene.add(ballMesh);

    const darkGreyMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

    // Create a plane on the left side
    const leftPlaneGeometry = new THREE.PlaneGeometry(60, window.innerHeight);
    const leftPlane = new THREE.Mesh(leftPlaneGeometry, darkGreyMaterial);
    leftPlane.position.set(bottomLeftPosition.x, bottomLeftPosition.y, -1); // Position it to cover the left side

    scene.add(leftPlane);

    renderer.render(scene, camera);

    const onResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", onResize);

    const onDragEnd = async () => {
      const position = rect.position;
      // Prompt the user for width and height
      const widthInput = prompt(
        "Enter the width of the new rectangle (in pixels):"
      );
      const heightInput = prompt(
        "Enter the height of the new rectangle (in pixels):"
      );

      if (widthInput === null || heightInput === null) {
        // Reset the orignal rect
        resetRectPosition();
        renderer.render(scene, camera);
        return;
      }

      // Convert input to numbers (you can add validation here)
      const width = parseFloat(widthInput);
      const height = parseFloat(heightInput);

      if (
        isNaN(width) ||
        isNaN(height) ||
        width < 10 ||
        height < 10 ||
        width > 70 ||
        height > 70
      ) {
        alert(
          "Invalid input. Please enter valid positive numbers for width and height between 10 and 70."
        );
        // Reset the orignal rect
        resetRectPosition();
        renderer.render(scene, camera);
        return;
      }

      /// Make the input a multiple of 5
      if (width % 5 !== 0 || height % 5 !== 0) {
        alert(
          "Invalid input. Please enter a multiple of 5 for width and height."
        );
        // Reset the orignal rect
        resetRectPosition();
        renderer.render(scene, camera);
        return;
      }

      const newGeometry = new THREE.PlaneGeometry(width, height);
      const newMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const newBasket = new THREE.Mesh(newGeometry, newMaterial);
      newBasket.position.set(position.x, position.y, position.z);
      newBasket.name = "newBasket";
      scene.add(newBasket);

      // check if the new rect will collide with any exisitng ones
      scene.children.forEach((child: THREE.Object3D) => {
        if (
          child.name !== "rect" &&
          child.name !== "newBasket" &&
          child.name !== "greenRect"
        ) {
          const boundingBox1 = new THREE.Box3().setFromObject(newBasket);
          const boundingBox2 = new THREE.Box3().setFromObject(child);

          // Check for intersection between the bounding boxes
          const doBoxesIntersect = boundingBox1.intersectsBox(boundingBox2);
          if (doBoxesIntersect) {
            alert("Collision! Please try again. ");
            scene.remove(newBasket);
            resetRectPosition();
            renderer.render(scene, camera);
            return;
          }
        }
      });
      newBasket.userData.circleCount = 0;
      newBasket.name = "basket";

      resetRectPosition();

      renderer.render(scene, camera);
    };

    const controls = new DragControls([rect], camera, renderer.domElement);
    controls.addEventListener("dragend", onDragEnd);

    const controlsBall = new DragControls(
      [ballMesh],
      camera,
      renderer.domElement
    );

    const onDropEndBall = () => {
      // Check if ball interests with a basket
      raycaster.set(ballMesh.position, new THREE.Vector3(0, 0, -1));

      // Perform the raycasting
      const intersects = raycaster.intersectObjects(scene.children);
      // Check for intersections with objects in the scene
      if (intersects.length > 0) {
        // Handle the intersection, e.g., addCircle to the intersected object
        const intersectedObject = intersects.find(
          (x) => x.object.name === "basket"
        );
        if (intersectedObject) {
          alert("circle Added");
          addCircle(intersectedObject.object);
        }
      }

      // Reset the original ball
      resetBallPosition();
      renderer.render(scene, camera);
    };

    controlsBall.addEventListener("dragend", onDropEndBall);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      controls.removeEventListener("dragend", onDragEnd);
    };
  }, []);

  return (
    <>
      <div ref={canvasContainerRef} id="canvas-main" />
    </>
  );
};
