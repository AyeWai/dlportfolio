<?php

namespace App\Http;
use Rubix\ML\Datasets\Labeled;

use Rubix\ML\Extractors\CSV;
use Rubix\ML\CrossValidation\HoldOut;
use Rubix\ML\CrossValidation\Metrics\Accuracy;
use Rubix\ML\Transformers\NumericStringConverter;

use Rubix\ML\Classifiers\MultilayerPerceptron;
use Rubix\ML\NeuralNet\Layers\Dense;
use Rubix\ML\NeuralNet\Layers\Dropout;
use Rubix\ML\NeuralNet\Layers\Activation;
use Rubix\ML\NeuralNet\Layers\PReLU;
use Rubix\ML\NeuralNet\ActivationFunctions\LeakyReLU;
use Rubix\ML\NeuralNet\Optimizers\Adam;
use Rubix\ML\NeuralNet\CostFunctions\CrossEntropy;
use Rubix\ML\CrossValidation\Metrics\MCC;
use Rubix\ML\Loggers\Screen;

class NeuralNetwork
{ 

  private $training_set;
  private $delimiter;
  private $array;

  public function __construct()
  {     
      $this->training_set = '../storage/app/public/datasets/winequality-red.csv';
      $this->delimiter = ';';
      var_dump($this->buildNeuralNetwork());

  }

  public function setNeuralNetworkParams(){

    return $array;
  }

  public function displayaccuracy(float $float, MultilayerPerceptron $estimator, Labeled $dataset){

    $validator = new HoldOut($float);
    $score = $validator->test($estimator, $dataset, new Accuracy());
    return $score;
    
  }

  public function displayNeuralNetwork(MultilayerPerceptron $estimator){
    $log = $estimator->setLogger(new Screen());
    $log = json_decode($log);
    return $log;
  }
      
  public function buildNeuralNetwork()
  { 


    //$validator = new HoldOut(0.5);

    $dataset = Labeled::fromIterator(new CSV($this->training_set, true,$this->delimiter))
    ->apply(new NumericStringConverter())
    ->transformLabels('sha1');

    $estimator = new MultilayerPerceptron([

      new Dense(400),
      new Activation(new LeakyReLU()),
      new Dropout(0.3),
      new Dense(200),
      new Activation(new LeakyReLU()),
      new Dropout(0.3),
      new Dense(100),
      new Activation(new LeakyReLU()),
      new Dropout(0.3),
      new Dense(50),
      new PReLU(),
    ], 512, new Adam(0.003), 1e-4, 1000, 1e-3, 3, 0.1, new CrossEntropy(), new MCC());
    $steps = $estimator->steps();
    var_dump($steps);
    //var_dump($this->displayNeuralNetwork($estimator));
    return($this->displayaccuracy(0.5, $estimator, $dataset));
    

    }

}