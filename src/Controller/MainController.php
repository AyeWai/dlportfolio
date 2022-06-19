<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use App\Entity\NeuralNetwork;

class MainController extends AbstractController
{
    /**
     * @Route("/home")
     */
    public function index(): Response
    {   
        $display_nt = new NeuralNetwork;

        return $this->render('main/index.html.twig', [
            'display_nt' => 'MainController',
        ]);
    }

    /**
     * @Route("/neural-network")
     */
    public function setparameters(): Response
    {
        //$display_nt = new NeuralNetwork;

        return $this->render('main/setparameters.html.twig', [
            'display_nt' => 'SetParameters',
        ]);
    }
}
